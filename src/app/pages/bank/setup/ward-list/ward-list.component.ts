import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { Observable, of } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { WardDialogComponent } from 'src/app/components/dialogs/bank/setup/ward-dialog/ward-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { WardTable } from 'src/app/core/enums/bank/setup/ward-table';
import { RemoveWardForm } from 'src/app/core/models/bank/forms/setup/ward/RemoveWard';
import { District } from 'src/app/core/models/bank/setup/district';
import { Ward } from 'src/app/core/models/bank/setup/ward';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { WardService } from 'src/app/core/services/bank/setup/ward/ward.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-ward-list',
  templateUrl: './ward-list.component.html',
  styleUrls: ['./ward-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    ReactiveFormsModule,
    RemoveItemDialogComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class WardListComponent implements OnInit {
  public userProfile!: LoginResponse;
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  // public wards: Ward[] = [];
  // public wardsData: Ward[] = [];
  public tableData: {
    wards: Ward[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Ward>;
  } = {
    wards: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Ward>([]),
  };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public WardTable: typeof WardTable = WardTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private wardService: WardService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableHeaders() {
    let TABLE_SHOWING = 5;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    // TableUtilities.createHeaders(
    //   this.tr,
    //   `wardDialog.wardsTable`,
    //   this.scope,
    //   this.headers,
    //   this.fb,
    //   this
    // );
    this.tr
      .selectTranslate(`wardDialog.wardsTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
          let col = this.fb.group({
            included: this.fb.control(index < TABLE_SHOWING, []),
            label: this.fb.control(column.label, []),
            value: this.fb.control(column.value, []),
          });
          col.get(`included`)?.valueChanges.subscribe((included) => {
            this.resetTableColumns();
          });
          if (index === labels.length - 1) {
            col.disable();
          }
          this.headers.push(col);
        });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableData.tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Ward,
      filter: string
    ) => {
      return data.Ward_Name &&
        data.Ward_Name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false ||
          (data.District_Name &&
            data.District_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Ward>(
      this.tableData.wards
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private requestWardList() {
    this.tableData.wards = [];
    this.tableLoading = true;
    this.wardService
      .getAllWardsList({})
      .then((result) => {
        // if (
        //   result.response &&
        //   typeof result.response !== 'number' &&
        //   typeof result.response !== 'string'
        // ) {
        //   this.wardsData = result.response;
        //   this.wards = this.wardsData;
        // }
        // this.tableLoading = false;
        // this.cdr.detectChanges();
        if (result.response instanceof Array) {
          this.tableData.wards = result.response;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.wards = [];
        }
        this.prepareDataSource();
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private requestDeleteRegion(body: RemoveWardForm) {
    this.startLoading = true;
    this.wardService
      .deleteWard(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response === 'number' &&
          result.response == body.sno
        ) {
          let msg = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate('setup.wardDialog.deletedWardSuccessfully')
          );
          this.requestWardList();
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  // private sortTableAsc(ind: number) {
  //   switch (ind) {
  //     case WardTable.DISTRICT:
  //       this.wards.sort((a, b) =>
  //         a?.District_Name.toLocaleLowerCase() >
  //         b?.District_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case WardTable.WARD:
  //       this.wards.sort((a, b) =>
  //         a?.Ward_Name.toLocaleLowerCase() > b?.Ward_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case WardTable.STATUS:
  //       this.wards.sort((a, b) =>
  //         a?.Ward_Status.toLocaleLowerCase() >
  //         b?.Ward_Status.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     default:
  //       break;
  //   }
  // }
  // private sortTableDesc(ind: number) {
  //   switch (ind) {
  //     case WardTable.DISTRICT:
  //       this.wards.sort((a, b) =>
  //         a?.District_Name.toLocaleLowerCase() <
  //         b?.District_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case WardTable.WARD:
  //       this.wards.sort((a, b) =>
  //         a?.Ward_Name.toLocaleLowerCase() < b?.Ward_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case WardTable.STATUS:
  //       this.wards.sort((a, b) =>
  //         a?.Ward_Status.toLocaleLowerCase() <
  //         b?.Ward_Status.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     default:
  //       break;
  //   }
  // }
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeaders();
    this.requestWardList();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'District_Name':
      case 'Ward_Name':
      case 'Ward_Status':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Action':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Ward_Name':
        return `${style} text-black font-semibold`;
      case 'Ward_Status':
        return `${PerformanceUtils.getActiveStatusStyles(
          element[key],
          'Active',
          'bg-green-100',
          'text-green-700',
          'bg-orange-100',
          'text-orange-700'
        )} text-center w-fit`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(this.tableData.wards, element);
      default:
        return element[key];
    }
  }
  openWardForm() {
    let dialogRef = this.dialog.open(WardDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        ward: null,
      },
    });
    dialogRef.componentInstance.addedWard.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestWardList();
    });
  }
  openEditWardForm(ward: Ward) {
    let dialogRef = this.dialog.open(WardDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        ward: ward,
      },
    });
    dialogRef.componentInstance.addedWard.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestWardList();
    });
  }
  openRemoveDialog(ward: Ward, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.wardDialog.removeWard`);
    dialog.message = this.tr.translate(`setup.wardDialog.sureRemoveWard`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: ward.SNO,
        userid: this.userProfile.Usno,
      };
      this.requestDeleteRegion(data);
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
