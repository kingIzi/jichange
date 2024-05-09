import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
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
import { EmployeeDetail } from 'src/app/core/models/bank/employee-detail';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { BankService } from 'src/app/core/services/bank/setup/bank.service';
import { EmployeeTable } from 'src/app/core/enums/bank/employee-table';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';

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
    LoaderRainbowComponent,
    RemoveItemDialogComponent,
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
  public headersMap = {
    FULL_NAME: EmployeeTable.FULL_NAME,
    DESIGNATION: EmployeeTable.DESIGNATION,
    EMAIL: EmployeeTable.EMAIL,
    MOBILE_NUMBER: EmployeeTable.MOBILE_NUMBER,
    STATUS: EmployeeTable.STATUS,
  };
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
    });
    this.tr
      .selectTranslate('bankUser.bankUserTable', {}, this.scope)
      .subscribe((labels: string[]) => {
        labels.forEach((label, index) => {
          let header = this.fb.group({
            label: this.fb.control(label, []),
            sortAsc: this.fb.control(false, []),
            included: this.fb.control(index < 5, []),
            values: this.fb.array([], []),
          });
          header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
            if (value === true) {
              this.sortTableAsc(index);
            } else {
              this.sortTableDesc(index);
            }
          });
          this.headers.push(header);
        });
      });
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case this.headersMap.FULL_NAME:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Full_Name.toLocaleLowerCase() > b.Full_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.DESIGNATION:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Desg_name.toLocaleLowerCase() > b.Desg_name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.EMAIL:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Email_Address.toLocaleLowerCase() >
          b.Email_Address.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.MOBILE_NUMBER:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Mobile_No.toLocaleLowerCase() > b.Mobile_No.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.STATUS:
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
      case this.headersMap.FULL_NAME:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Full_Name.toLocaleLowerCase() < b.Full_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.DESIGNATION:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Desg_name.toLocaleLowerCase() < b.Desg_name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.EMAIL:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Email_Address.toLocaleLowerCase() <
          b.Email_Address.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.MOBILE_NUMBER:
        this.employeeDetails.sort((a: EmployeeDetail, b: EmployeeDetail) =>
          a.Mobile_No.toLocaleLowerCase() < b.Mobile_No.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.STATUS:
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
        this.cdr.detectChanges();
        throw err;
      });
  }
  private bankUserListKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(this.headersMap.FULL_NAME)) {
      keys.push('Full_Name');
    }
    if (indexes.includes(this.headersMap.DESIGNATION)) {
      keys.push('Desg_name');
    }
    if (indexes.includes(this.headersMap.EMAIL)) {
      keys.push('Email_Address');
    }
    if (indexes.includes(this.headersMap.MOBILE_NUMBER)) {
      keys.push('Mobile_No');
    }
    if (indexes.includes(this.headersMap.STATUS)) {
      keys.push('Emp_Status');
    }
    return keys;
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.requestBankDetails();
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  getActiveStatusStyles(status: string) {
    return status.toLocaleLowerCase() === 'active'
      ? 'bg-green-100 text-green-600 px-4 py-1 rounded-lg shadow'
      : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow';
  }
  openBankUserForm() {
    let dialogRef = this.dialog.open(BankUserDialogComponent, {
      width: '600px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
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
    dialogRef.afterClosed().subscribe((result) => {});
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
  searchTable(searchText: string) {
    if (searchText) {
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
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
}
