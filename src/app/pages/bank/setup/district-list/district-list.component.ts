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
import { DistrictDialogComponent } from 'src/app/components/dialogs/bank/setup/district-dialog/district-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { DistrictTable } from 'src/app/core/enums/bank/setup/district-table';
import { RemoveDistrictForm } from 'src/app/core/models/bank/forms/setup/district/remove-district-form';
import { District } from 'src/app/core/models/bank/setup/district';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { DistrictService } from 'src/app/core/services/bank/setup/district/district.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-district-list',
  templateUrl: './district-list.component.html',
  styleUrls: ['./district-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    RemoveItemDialogComponent,
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
export class DistrictListComponent implements OnInit {
  public userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  // public districts: District[] = [];
  // public districtsData: District[] = [];
  public tableData: {
    districts: District[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<District>;
  } = {
    districts: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<District>([]),
  };
  public tableFormGroup!: FormGroup;
  public DistrictTable: typeof DistrictTable = DistrictTable;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private districtService: DistrictService,
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
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    // TableUtilities.createHeaders(
    //   this.tr,
    //   `districtDialog.districtsTable`,
    //   this.scope,
    //   this.headers,
    //   this.fb,
    //   this
    // );
    this.tr
      .selectTranslate(`districtDialog.districtsTable`, {}, this.scope)
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
      data: District,
      filter: string
    ) => {
      return data.Region_Name &&
        data.Region_Name.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        )
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
    this.tableData.dataSource = new MatTableDataSource<District>(
      this.tableData.districts
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private requestDistrictList() {
    this.tableData.districts = [];
    this.tableLoading = true;
    this.districtService
      .getAllDistrictList({})
      .then((result) => {
        // if (
        //   result.response &&
        //   typeof result.response !== 'number' &&
        //   typeof result.response !== 'string'
        // ) {
        //   this.districtsData = result.response;
        //   this.districts = this.districtsData;
        // }
        // this.tableLoading = false;
        // this.cdr.detectChanges();
        if (result.response instanceof Array) {
          this.tableData.districts = result.response as District[];
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.districts = [];
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
  private requestDeleteDistrict(body: RemoveDistrictForm) {
    this.startLoading = true;
    this.districtService
      .deleteDistrict(body)
      .then((result) => {
        if (
          result.message.toLocaleLowerCase() ==
          'Successfuly Deleted'.toLocaleLowerCase()
        ) {
          let msg = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(
              'setup.districtDialog.deletedDistrictSuccessfully'
            )
          );
          this.requestDistrictList();
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
  //     case DistrictTable.REGION:
  //       this.districts.sort((a, b) =>
  //         a.Region_Name.toLocaleLowerCase() > b.Region_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case DistrictTable.DISTRICT:
  //       this.districts.sort((a, b) =>
  //         a.District_Name.toLocaleLowerCase() >
  //         b.District_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case DistrictTable.STATUS:
  //       this.districts.sort((a, b) =>
  //         a.District_Status.toLocaleLowerCase() >
  //         b.District_Status.toLocaleLowerCase()
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
  //     case DistrictTable.REGION:
  //       this.districts.sort((a, b) =>
  //         a.Region_Name.toLocaleLowerCase() < b.Region_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case DistrictTable.DISTRICT:
  //       this.districts.sort((a, b) =>
  //         a.District_Name.toLocaleLowerCase() <
  //         b.District_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case DistrictTable.STATUS:
  //       this.districts.sort((a, b) =>
  //         a.District_Status.toLocaleLowerCase() <
  //         b.District_Status.toLocaleLowerCase()
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
    this.requestDistrictList();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'District_Name':
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
      case 'District_Name':
        return `${style} text-black font-semibold`;
      case 'District_Status':
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
        return PerformanceUtils.getIndexOfItem(
          this.tableData.districts,
          element
        );
      default:
        return element[key];
    }
  }
  openDistrictForm() {
    let dialogRef = this.dialog.open(DistrictDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        district: null,
      },
    });
    dialogRef.componentInstance.addedDistrict.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestDistrictList();
    });
  }
  openEditDistrictDialog(district: District) {
    let dialogRef = this.dialog.open(DistrictDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        district: district,
      },
    });
    dialogRef.componentInstance.addedDistrict.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestDistrictList();
    });
  }
  openRemoveDialog(district: District, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.districtDialog.removeDistrict`);
    dialog.message = this.tr.translate(
      `setup.districtDialog.sureRemoveDistrict`
    );
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let body = {
        sno: district.SNO,
        userid: this.userProfile.Usno,
      } as RemoveDistrictForm;
      this.requestDeleteDistrict(body);
    });
  }
  get headers() {
    return this.tableFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
