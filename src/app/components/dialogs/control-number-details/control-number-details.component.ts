import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DisplayMessageBoxComponent } from '../display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { CommonModule } from '@angular/common';
import { SuccessMessageBoxComponent } from '../success-message-box/success-message-box.component';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { LoginService } from 'src/app/core/services/login.service';
import { GetControlResponse } from 'src/app/core/models/vendors/get-control-response';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TimeoutError } from 'rxjs';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-control-number-details',
  templateUrl: './control-number-details.component.html',
  styleUrls: ['./control-number-details.component.scss'],
  standalone: true,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'auth' }],
  imports: [
    DisplayMessageBoxComponent,
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
  ],
})
export class ControlNumberDetailsComponent implements OnInit {
  public startLoading: boolean = false;
  public controlNumberFormGroup!: FormGroup;
  public foundFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @Output() public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('controlFound', { static: true })
  controlFound!: ElementRef<HTMLDialogElement>;
  constructor(
    private dialogRef: MatDialogRef<ControlNumberDetailsComponent>,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.createForm();
    this.createControlFoundFormGroup();
  }

  private createControlFoundFormGroup() {
    this.foundFormGroup = this.fb.group({
      Control_No: this.fb.control('', []),
      Cust_Name: this.fb.control('', []),
      Payment_Type: this.fb.control('', []),
      Item_Total_Amount: this.fb.control(0, []),
      Balance: this.fb.control(0, []),
      Currency: this.fb.control('', []),
    });
  }

  private modifyControlFoundData(controlFound: GetControlResponse) {
    this.Control_No.setValue(controlFound?.Control_No?.trim());
    this.Cust_Name.setValue(controlFound?.Cust_Name?.trim());
    this.Payment_Type.setValue(controlFound?.Payment_Type?.trim());
    this.Item_Total_Amount.setValue(controlFound?.Item_Total_Amount);
    this.Balance.setValue(controlFound?.Balance);
    this.Currency.setValue(controlFound?.Currency_Code);
  }

  private createForm() {
    this.controlNumberFormGroup = this.fb.group({
      control: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^\S+$/),
      ]),
    });
  }

  private formErrors(
    errorsPath: string = 'auth.controlNumberDetails.form.errors.dialogs'
  ) {
    if (this.control.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.missingAccountNo`)
      );
    }
  }

  private requestVerifyControlNumber(body: { control: string }) {
    this.startLoading = true;
    this.loginService
      .verifyControlNumber(body)
      .then((results: any) => {
        this.startLoading = false;
        if (!results.response || results.response === 0) {
          this.controlNumberNotFoundMessage();
        } else {
          this.modifyControlFoundData(results.response);
          this.controlFound.nativeElement.showModal();
        }
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

  setControlNumberValue(value: string) {
    this.control.setValue(value.trim());
  }

  submitControlNumberForm() {
    if (this.controlNumberFormGroup.invalid) {
      this.controlNumberFormGroup.markAllAsTouched();
      this.formErrors();
      return;
    }
    this.requestVerifyControlNumber(this.controlNumberFormGroup.value);
  }

  controlNumberNotFoundMessage() {
    let message = this.tr.translate(
      `auth.controlNumberDetails.form.errors.dialogs.notFoundMessage`
    );

    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate(
        `auth.controlNumberDetails.form.errors.dialogs.notFound`
      ),
      message.replace('{}', this.control.value)
    );
  }

  submitFailed() {
    AppUtilities.noInternetError(this.displayMessageBox, this.tr);
  }

  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }

  get control() {
    return this.controlNumberFormGroup.get('control') as FormControl;
  }

  get Control_No() {
    return this.foundFormGroup.get('Control_No') as FormControl;
  }

  get Cust_Name() {
    return this.foundFormGroup.get('Cust_Name') as FormControl;
  }

  get Payment_Type() {
    return this.foundFormGroup.get('Payment_Type') as FormControl;
  }

  get Item_Total_Amount() {
    return this.foundFormGroup.get('Item_Total_Amount') as FormControl;
  }

  get Balance() {
    return this.foundFormGroup.get('Balance') as FormControl;
  }

  get Currency() {
    return this.foundFormGroup.get('Currency') as FormControl;
  }
}
