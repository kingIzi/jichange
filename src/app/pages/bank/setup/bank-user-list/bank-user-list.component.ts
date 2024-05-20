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
import { TimeoutError } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';

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
  public employeeDetails: EmployeeDetail[] = [];
  public employeeDetailsData: EmployeeDetail[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public EmployeeTable: typeof EmployeeTable = EmployeeTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private bankService: BankService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `bankUser.bankUserTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case EmployeeTable.FULL_NAME:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Full_Name.toLocaleLowerCase() > b.Full_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmployeeTable.DESIGNATION:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Desg_name.toLocaleLowerCase() > b.Desg_name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmployeeTable.EMAIL:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Email_Address.toLocaleLowerCase() >
          b.Email_Address.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmployeeTable.MOBILE_NUMBER:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Mobile_No.toLocaleLowerCase() > b.Mobile_No.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmployeeTable.STATUS:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Emp_Status.toLocaleLowerCase() > b.Emp_Status.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case EmployeeTable.FULL_NAME:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Full_Name.toLocaleLowerCase() < b.Full_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmployeeTable.DESIGNATION:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Desg_name.toLocaleLowerCase() < b.Desg_name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmployeeTable.EMAIL:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Email_Address.toLocaleLowerCase() <
          b.Email_Address.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmployeeTable.MOBILE_NUMBER:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Mobile_No.toLocaleLowerCase() < b.Mobile_No.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmployeeTable.STATUS:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Emp_Status.toLocaleLowerCase() < b.Emp_Status.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private requestBankDetails() {
    //this.startLoading = true;
    this.tableLoading = true;
    this.bankService
      .postEmployeeDetails({})
      .then((results: any) => {
        this.employeeDetailsData =
          results.response === 0 ? [] : results.response;
        this.employeeDetails = this.employeeDetailsData;
        //this.startLoading = false;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        //this.startLoading = false;
        this.tableLoading = false;
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
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
    if (searchText) {
      paginator.firstPage();
      let indexes = this.headers.controls
        .map((control, index) => {
          return control.get('included')?.value ? index : -1;
        })
        .filter((num) => num !== -1);
      let text = searchText.trim().toLowerCase(); // Use toLowerCase() instead of toLocalLowercase()
      let keys = this.bankUserListKeys(indexes);
      this.employeeDetails = this.employeeDetailsData.filter(
        (employeeDetail: any) => {
          return keys.some((key) =>
            employeeDetail[key]?.toLocaleLowerCase().includes(text)
          );
        }
      );
    } else {
      this.employeeDetails = this.employeeDetailsData;
    }
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.requestBankDetails();
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
