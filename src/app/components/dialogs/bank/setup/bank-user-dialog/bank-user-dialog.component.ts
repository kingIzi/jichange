import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { BranchDialogComponent } from '../branch-dialog/branch-dialog.component';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { CommonModule } from '@angular/common';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { BankService } from 'src/app/core/services/bank/setup/bank/bank.service';
import { EmployeeDetail } from 'src/app/core/models/bank/setup/employee-detail';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { DesignationService } from 'src/app/core/services/bank/setup/designation/designation.service';
import { TimeoutError, catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { Designation } from 'src/app/core/models/bank/setup/designation';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { NgxLoadingModule } from 'ngx-loading';
import { AddBankUserForm } from 'src/app/core/models/bank/forms/setup/bank-user/add-bank-user-form';
import Swal from 'sweetalert2';
import { LoginResponse } from 'src/app/core/models/login-response';

@Component({
  selector: 'app-bank-user-dialog',
  templateUrl: './bank-user-dialog.component.html',
  styleUrls: ['./bank-user-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    //LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
    PhoneNumberInputComponent,
    NgxLoadingModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class BankUserDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public bankUserForm!: FormGroup;
  public employeeDetail!: EmployeeDetail;
  public designations: Designation[] = [];
  public branches: Branch[] = [];
  public userProfile!: LoginResponse;
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public added = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BranchDialogComponent>,
    private tr: TranslocoService,
    private bankService: BankService,
    private designationService: DesignationService,
    private branchService: BranchService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { Detail_Id: number },
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private formErrors(errorsPath: string = 'setup.bankUser.form.dialog') {
    if (this.empid.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.employeeId`)
      );
    }
    if (this.fname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.firstName`)
      );
    }
    if (this.lname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.lastName`)
      );
    }
    if (this.user.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.username`)
      );
    }
    if (this.desg.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.designation`)
      );
    }
    if (this.branch.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.branch`)
      );
    }
    if (this.email.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.emailId`)
      );
    }
    if (this.mobile.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.mobileNo`)
      );
    }
    if (this.gender.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private createForm() {
    this.bankUserForm = this.fb.group({
      empid: this.fb.control('', [Validators.required]),
      fname: this.fb.control('', [Validators.required]),
      mname: this.fb.control('', []),
      lname: this.fb.control('', [Validators.required]),
      user: this.fb.control('', [Validators.required]),
      desg: this.fb.control('', [Validators.required]),
      branch: this.fb.control('', []),
      email: this.fb.control('', [Validators.required, Validators.email]),
      mobile: this.fb.control('', [
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      gender: this.fb.control('', [Validators.required]),
      dummy: this.fb.control(true, [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
    });
  }
  private setEditFormValues() {
    this.bankUserForm.setValue({
      empid: this.employeeDetail.Emp_Id_No,
      fname: this.employeeDetail.First_Name,
      mname: this.employeeDetail.Middle_name,
      lname: this.employeeDetail.Last_name,
      user: this.employeeDetail.User_name,
      desg: this.employeeDetail.Desg_Id
        ? this.employeeDetail.Desg_Id.toString()
        : '',
      branch: this.employeeDetail.Branch_Sno
        ? this.employeeDetail?.Branch_Sno.toString()
        : '',
      email: this.employeeDetail.Email_Address,
      mobile: this.employeeDetail.Mobile_No,
      gender: this.employeeDetail.Emp_Status,
      dummy: true,
      sno: this.employeeDetail.Detail_Id,
      userid: this.userProfile.Usno,
    });
  }
  private fetchFormData() {
    this.startLoading = true;
    let designationList = from(this.designationService.getDesignationList());
    let branchList = from(this.branchService.postBranchList({}));
    let mergedRes = zip(designationList, branchList);
    let res = lastValueFrom(
      mergedRes.pipe(
        map((results) => {
          return results;
        }),
        catchError((err) => {
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        })
      )
    );
    res
      .then((results: any) => {
        let [designations, branches] = results as any;
        this.designations =
          designations.response === 0 ? [] : designations.response;
        this.branches = branches.response === 0 ? [] : branches.response;
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
  private async createEditForm(detailId: number) {
    this.startLoading = true;
    this.employeeDetail = (
      (await this.bankService.postFetchEmployeeDetail({
        sno: detailId.toString(),
      })) as HttpDataResponse<EmployeeDetail>
    ).response;
    this.setEditFormValues();
    this.startLoading = false;
    this.cdr.detectChanges();
  }
  private prepareForm() {
    this.fetchFormData();
    if (this.data?.Detail_Id) {
      this.createForm();
      this.createEditForm(this.data?.Detail_Id);
    } else {
      this.createForm();
    }
  }
  private requestAddBankUser(form: AddBankUserForm) {
    this.startLoading = true;
    this.bankService
      .addEmployeeDetail(form)
      .then((result) => {
        console.log(result);
        if (typeof result.response === 'number' && result.response > 0) {
          let message = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`setup.bankUser.addedBankUserSuccessfully`)
          );
          this.added.emit();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.bankUser.failedToAddUser`)
          );
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private requestModifyBankUser(form: AddBankUserForm) {
    this.startLoading = true;
    this.bankService
      .addEmployeeDetail(form)
      .then((result) => {
        if (typeof result.response === 'number' && result.response > 0) {
          let message = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`setup.bankUser.modifiedBankUserSuccessfully`)
          );
          message.then(() => {
            this.added.emit();
          });
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.bankUser.failedToModifyUser`)
          );
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit() {
    this.parseUserProfile();
    this.prepareForm();
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitBankUserForm() {
    if (this.bankUserForm.valid && !this.data.Detail_Id) {
      this.requestAddBankUser(this.bankUserForm.value);
    } else if (this.bankUserForm.valid && this.data.Detail_Id) {
      this.requestModifyBankUser(this.bankUserForm.value);
    } else {
      this.bankUserForm.markAllAsTouched();
      this.formErrors();
    }
  }
  get empid() {
    return this.bankUserForm.get('empid') as FormControl;
  }
  get fname() {
    return this.bankUserForm.get('fname') as FormControl;
  }
  get mname() {
    return this.bankUserForm.get('mname') as FormControl;
  }
  get lname() {
    return this.bankUserForm.get('lname') as FormControl;
  }
  get user() {
    return this.bankUserForm.get('user') as FormControl;
  }
  get desg() {
    return this.bankUserForm.get('desg') as FormControl;
  }
  get branch() {
    return this.bankUserForm.get('branch') as FormControl;
  }
  get email() {
    return this.bankUserForm.get('email') as FormControl;
  }
  get mobile() {
    return this.bankUserForm.get('mobile') as FormControl;
  }
  get gender() {
    return this.bankUserForm.get('gender') as FormControl;
  }
}
