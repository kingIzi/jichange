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
import { BankUserDialogComponent } from 'src/app/components/dialogs/bank/setup/bank-user-dialog/bank-user-dialog.component';
import { EmployeeDetail } from 'src/app/core/models/bank/setup/employee-detail';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { BankService } from 'src/app/core/services/bank/setup/bank/bank.service';
import { EmployeeTable } from 'src/app/core/enums/bank/setup/employee-table';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Observable, TimeoutError, of } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';

@Component({
  selector: 'app-bank-user-list',
  templateUrl: './bank-user-list.component.html',
  styleUrls: ['./bank-user-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    LoaderInfiniteSpinnerComponent,
    RemoveItemDialogComponent,
    DisplayMessageBoxComponent,
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
export class BankUserListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  // public employeeDetails: EmployeeDetail[] = [];
  // public employeeDetailsData: EmployeeDetail[] = [];
  public tableData: {
    employeeDetails: EmployeeDetail[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<EmployeeDetail>;
  } = {
    employeeDetails: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<EmployeeDetail>([]),
  };
  public branches: Branch[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public EmployeeTable: typeof EmployeeTable = EmployeeTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private bankService: BankService,
    private branchService: BranchService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 7;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    // TableUtilities.createHeaders(
    //   this.tr,
    //   `bankUser.bankUserTable`,
    //   this.scope,
    //   this.headers,
    //   this.fb,
    //   this,
    //   6,
    //   true
    // );
    this.tr
      .selectTranslate(`bankUser.bankUserTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
          let col = this.fb.group({
            included: this.fb.control(
              index === 0 ? false : index < TABLE_SHOWING,
              []
            ),
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
  // private sortTableAsc(ind: number) {
  //   switch (ind) {
  //     case EmployeeTable.FULL_NAME:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Full_Name.toLocaleLowerCase() > b.Full_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmployeeTable.DESIGNATION:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Desg_name.toLocaleLowerCase() > b.Desg_name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmployeeTable.EMAIL:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Email_Address.toLocaleLowerCase() >
  //         b.Email_Address.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmployeeTable.MOBILE_NUMBER:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Mobile_No.toLocaleLowerCase() > b.Mobile_No.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmployeeTable.STATUS:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Emp_Status.toLocaleLowerCase() > b.Emp_Status.toLocaleLowerCase()
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
  //     case EmployeeTable.FULL_NAME:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Full_Name.toLocaleLowerCase() < b.Full_Name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmployeeTable.DESIGNATION:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Desg_name.toLocaleLowerCase() < b.Desg_name.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmployeeTable.EMAIL:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Email_Address.toLocaleLowerCase() <
  //         b.Email_Address.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmployeeTable.MOBILE_NUMBER:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Mobile_No.toLocaleLowerCase() < b.Mobile_No.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmployeeTable.STATUS:
  //       this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
  //         a.Emp_Status.toLocaleLowerCase() < b.Emp_Status.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     default:
  //       break;
  //   }
  // }
  private requestBranchDetailsList() {
    this.startLoading = true;
    this.branchService
      .postBranchList({})
      .then((result) => {
        if (
          typeof result.response !== 'string' &&
          typeof result.response !== 'number'
        ) {
          this.branches = result.response;
        }
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
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: EmployeeDetail,
      filter: string
    ) => {
      return data.Full_Name &&
        data.Full_Name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false ||
          (data.Desg_name &&
            data.Desg_name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<EmployeeDetail>(
      this.tableData.employeeDetails
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private requestBankDetails() {
    this.tableLoading = true;
    this.bankService
      .postEmployeeDetails({})
      .then((result) => {
        if (result.response instanceof Array) {
          this.tableData.employeeDetails = result.response;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.employeeDetails = [];
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
  private bankUserListKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(EmployeeTable.FULL_NAME)) {
      keys.push('Full_Name');
    }
    if (indexes.includes(EmployeeTable.DESIGNATION)) {
      keys.push('Desg_name');
    }
    if (indexes.includes(EmployeeTable.EMAIL)) {
      keys.push('Email_Address');
    }
    if (indexes.includes(EmployeeTable.MOBILE_NUMBER)) {
      keys.push('Mobile_No');
    }
    if (indexes.includes(EmployeeTable.STATUS)) {
      keys.push('Emp_Status');
    }
    return keys;
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.requestBankDetails();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Full_Name':
      case 'Desg_name':
      case 'Email_Address':
      case 'Mobile_No':
      case 'Emp_Status':
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
      case 'Full_Name':
        return `${style} text-black font-semibold`;
      case 'Emp_Status':
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
          this.tableData.employeeDetails,
          element
        );
      default:
        return element[key];
    }
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  openBankUserForm() {
    let dialogRef = this.dialog.open(BankUserDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        Detail_Id: null,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      this.requestBankDetails();
      dialogRef.close();
    });
  }
  openEditBankUserForm(employeeDetail: EmployeeDetail) {
    let dialogRef = this.dialog.open(BankUserDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        Detail_Id: employeeDetail.Detail_Id,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      this.requestBankDetails();
      dialogRef.close();
    });
  }
  openRemoveDialog(
    employeeDetail: EmployeeDetail,
    dialog: RemoveItemDialogComponent
  ) {
    dialog.title = this.tr.translate(`setup.branch.form.dialog.removeBranch`);
    dialog.message = this.tr.translate(`setup.branch.form.dialog.sureDelete`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe((e) => {
      console.log(employeeDetail);
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
