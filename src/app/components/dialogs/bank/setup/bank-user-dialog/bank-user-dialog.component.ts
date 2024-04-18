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
import { BankService } from 'src/app/core/services/setup/bank.service';
import { EmployeeDetail } from 'src/app/core/models/bank/employee-detail';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { DesignationService } from 'src/app/core/services/setup/designation.service';
import { catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { BranchService } from 'src/app/core/services/setup/branch.service';
import { Designation } from 'src/app/core/models/bank/designation';
import { Branch } from 'src/app/core/models/bank/branch';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

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
    LoaderRainbowComponent,
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
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public isLoading = new EventEmitter<any>();
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
  private formErrors(errorsPath: string = 'setup.bankUser.form.dialog') {
    if (this.employeeId.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.employeeId`)
      );
    }
    if (this.firstName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.firstName`)
      );
    }
    if (this.lastName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.lastName`)
      );
    }
    if (this.middleName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.middleName`)
      );
    }
    if (this.username.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.username`)
      );
    }
    if (this.designation.invalid) {
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
    if (this.emailId.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.emailId`)
      );
    }
    if (this.mobileNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.mobileNo`)
      );
    }
    if (this.status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private createForm() {
    this.bankUserForm = this.fb.group({
      employeeId: this.fb.control('', [Validators.required]),
      firstName: this.fb.control('', [Validators.required]),
      middleName: this.fb.control('', [Validators.required]),
      lastName: this.fb.control('', [Validators.required]),
      username: this.fb.control('', [Validators.required]),
      designation: this.fb.control('', [Validators.required]),
      branch: this.fb.control('', []),
      emailId: this.fb.control('', [Validators.required, Validators.email]),
      mobileNo: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      status: this.fb.control(false, [Validators.required]),
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
    this.bankUserForm.setValue({
      employeeId: this.employeeDetail.Detail_Id,
      firstName: this.employeeDetail.First_Name,
      middleName: this.employeeDetail.Middle_name,
      lastName: this.employeeDetail.Last_name,
      username: this.employeeDetail.Email_Address,
      designation: this.employeeDetail.Desg_Id
        ? this.employeeDetail.Desg_Id.toString()
        : '',
      branch: this.employeeDetail.Branch_Sno
        ? this.employeeDetail?.Branch_Sno.toString()
        : '',
      emailId: this.employeeDetail.Email_Address,
      mobileNo: this.employeeDetail.Mobile_No,
      status: this.employeeDetail.Emp_Status.toLocaleLowerCase() === 'active',
    });
    this.startLoading = false;
    this.cdr.detectChanges();
  }
  private async prepareForm() {
    this.fetchFormData();
    if (this.data?.Detail_Id) {
      this.createForm();
      this.createEditForm(this.data?.Detail_Id);
    } else {
      this.createForm();
    }
  }
  async ngOnInit() {
    this.prepareForm();
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  submitBankUserForm() {
    if (this.bankUserForm.valid) {
      this.isLoading.emit(this.bankUserForm.value);
    }
    this.bankUserForm.markAllAsTouched();
    this.formErrors();
  }
  get employeeId() {
    return this.bankUserForm.get('employeeId') as FormControl;
  }
  get firstName() {
    return this.bankUserForm.get('firstName') as FormControl;
  }
  get middleName() {
    return this.bankUserForm.get('middleName') as FormControl;
  }
  get lastName() {
    return this.bankUserForm.get('lastName') as FormControl;
  }
  get username() {
    return this.bankUserForm.get('username') as FormControl;
  }
  get designation() {
    return this.bankUserForm.get('designation') as FormControl;
  }
  get branch() {
    return this.bankUserForm.get('branch') as FormControl;
  }
  get emailId() {
    return this.bankUserForm.get('emailId') as FormControl;
  }
  get mobileNo() {
    return this.bankUserForm.get('mobileNo') as FormControl;
  }
  get status() {
    return this.bankUserForm.get('status') as FormControl;
  }
}
