import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DatePickerDialogComponent } from 'src/app/components/dialogs/date-picker-dialog/date-picker-dialog.component';
import { RegionDialogComponent } from 'src/app/components/dialogs/bank/setup/region-dialog/region-dialog.component';
import { BreadcrumbService } from 'xng-breadcrumb';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { LoginResponse } from 'src/app/core/models/login-response';
import { RegionService } from 'src/app/core/services/bank/setup/region/region.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Region } from 'src/app/core/models/bank/setup/region';
import { RegionTable } from 'src/app/core/enums/bank/setup/region-table';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { Observable, of } from 'rxjs';
import { Country } from 'src/app/core/models/bank/setup/country';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';

@Component({
  selector: 'app-region-list',
  templateUrl: './region-list.component.html',
  styleUrls: ['./region-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    ReactiveFormsModule,
    LoaderInfiniteSpinnerComponent,
    RemoveItemDialogComponent,
    MatTableModule,
    MatSortModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class RegionListComponent implements OnInit {
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public tableFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public RegionTable: typeof RegionTable = RegionTable;
  // public regionsData: Region[] = [];
  // public regions: Region[] = [];
  public tableData: {
    regions: Region[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Region>;
  } = {
    regions: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Region>([]),
  };
  public userProfile!: LoginResponse;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private tr: TranslocoService,
    private regionService: RegionService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Region,
      filter: string
    ) => {
      return data.Country_Name &&
        data.Country_Name.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        )
        ? true
        : false ||
          (data.Region_Name &&
            data.Region_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Region>(
      this.tableData.regions
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private requestRegionList() {
    // this.emptyRegionList();
    this.tableData.regions = [];
    this.tableLoading = true;
    this.regionService
      .getAllRegionsList({})
      .then((result) => {
        // if (
        //   result.response &&
        //   typeof result.response !== 'string' &&
        //   typeof result.response !== 'number'
        // ) {
        //   this.regionsData = result.response;
        //   this.regions = this.regionsData;
        // }
        // this.tableLoading = false;
        // this.cdr.detectChanges();
        if (result.response instanceof Array) {
          this.tableData.regions = result.response as Region[];
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.regions = [];
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
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 5;
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    // TableUtilities.createHeaders(
    //   this.tr,
    //   `regionDialog.regionsTable`,
    //   this.scope,
    //   this.headers,
    //   this.fb,
    //   this
    // );
    this.tr
      .selectTranslate(`regionDialog.regionsTable`, {}, this.scope)
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
  private requestDeleteRegion(body: { sno: number; userid: number }) {
    this.startLoading = true;
    this.regionService
      .deleteRegion(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response === 'number' &&
          result.response === body.sno
        ) {
          let sal = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`setup.regionDialog.removeRegionSuccessfully`)
          );
          this.requestRegionList();
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  // private sortTableAsc(ind: number) {
  //   switch (ind) {
  //     case RegionTable.COUNTRY:
  //       this.regions.sort((a, b) =>
  //         a.Country_Name.toLocaleLowerCase() >
  //         b.Country_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case RegionTable.REGION:
  //       this.regions.sort((a, b) =>
  //         a.Region_Name.toLocaleLowerCase() > b.Region_Name.toLocaleLowerCase()
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
  //     case RegionTable.COUNTRY:
  //       this.regions.sort((a, b) =>
  //         a.Country_Name.toLocaleLowerCase() <
  //         b.Country_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case RegionTable.REGION:
  //       this.regions.sort((a, b) =>
  //         a.Region_Name.toLocaleLowerCase() < b.Region_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     default:
  //       break;
  //   }
  // }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeadersFormGroup();
    this.requestRegionList();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Country_Name':
      case 'Region_Name':
      case 'District_Status':
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
      case 'Region_Name':
        return `${style} text-black font-semibold`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(this.tableData.regions, element);
      default:
        return element[key];
    }
  }
  openAddRegionDialog() {
    let dialogRef = this.dialog.open(RegionDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        region: null,
      },
    });
    dialogRef.componentInstance.addedRegion.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestRegionList();
    });
  }
  openEditRegionDialog(region: Region) {
    let dialogRef = this.dialog.open(RegionDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        region: region,
      },
    });
    dialogRef.componentInstance.addedRegion.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestRegionList();
    });
  }
  openRemoveDialog(region: Region, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.regionDialog.removeRegion`);
    dialog.message = this.tr.translate(`setup.regionDialog.sureRemoveRegion`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: region.Region_SNO,
        userid: this.userProfile.Usno,
      };
      this.requestDeleteRegion(data);
    });
  }
  get headers() {
    return this.tableFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
