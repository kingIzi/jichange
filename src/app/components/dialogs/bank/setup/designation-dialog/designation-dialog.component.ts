import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Designation } from 'src/app/core/models/bank/setup/designation';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { DesignationService } from 'src/app/core/services/bank/setup/designation/designation.service';
import { TimeoutError } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AddDesignationForm } from 'src/app/core/models/bank/forms/setup/designation/add-designation-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-designation-dialog',
  templateUrl: './designation-dialog.component.html',
  styleUrls: ['./designation-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class DesignationDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public designationForm!: FormGroup;
  public addedDesignation = new EventEmitter<Designation>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddDesignation')
  confirmAddDesignation!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DesignationDialogComponent>,
    private tr: TranslocoService,
    private designationService: DesignationService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any,
    @Inject(MAT_DIALOG_DATA) public data: { designationData: Designation }
  ) {}
  private formErrors(errorsPath: string = 'setup.designation.form.dialog') {
    if (this.designationForm.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingDesignation`)
      );
    }
  }
  private createForm() {
    this.designationForm = this.fb.group({
      desg: this.fb.control('', [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      dummy: this.fb.control(true, [Validators.required]),
    });
  }
  private createEditForm(designation: Designation) {
    this.designationForm = this.fb.group({
      desg: this.fb.control(designation.Desg_Name, [Validators.required]),
      sno: this.fb.control(designation.Desg_Id, [Validators.required]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      dummy: this.fb.control(true, [Validators.required]),
    });
  }
  private switchInsertDesignationErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.desg.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing designation'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.designation.form.dialog.missingDesignation`
        );
      case 'Missing SNO'.toLocaleLowerCase():
        return this.tr.translate(`errors.missingUserIdMessage`);
      default:
        return this.tr.translate(
          `setup.designation.form.dialog.failedToAddDesignation`
        );
    }
  }
  private parseInsertDesignationResponse(
    result: HttpDataResponse<number | Designation>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchInsertDesignationErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let message = this.tr.translate(
        `setup.designation.addedDesignationSuccessfully`
      );
      AppUtilities.showSuccessMessage(
        message,
        (e: MouseEvent) => {},
        this.tr.translate('actions.ok')
      );
      this.addedDesignation.emit(result.response as Designation);
    }
  }
  private requestInsertDesignation(form: AddDesignationForm, message: string) {
    this.startLoading = true;
    this.designationService
      .addDesignation(form)
      .then((result) => {
        this.parseInsertDesignationResponse(result);
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
  ngOnInit(): void {
    if (this.data.designationData) {
      this.createEditForm(this.data.designationData);
    } else {
      this.createForm();
    }
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  addDesignation() {
    if (!this.data.designationData) {
      let message = this.tr.translate(
        `setup.designation.form.dialog.addedSuccessfully`
      );
      this.requestInsertDesignation(this.designationForm.value, message);
    } else {
      let message = this.tr.translate(
        `setup.designation.form.dialog.modifiedSuccessfully`
      );
      this.requestInsertDesignation(this.designationForm.value, message);
    }
  }
  submitDesignationForm() {
    if (this.designationForm.valid) {
      this.confirmAddDesignation.nativeElement.showModal();
    } else {
      this.designationForm.markAllAsTouched();
    }
  }
  get desg() {
    return this.designationForm.get('desg') as FormControl;
  }
}
