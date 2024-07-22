import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  Form,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { Observable, of } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SubmitMessageBoxComponent } from 'src/app/components/dialogs/submit-message-box/submit-message-box.component';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-confirm-delivery-code',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    SubmitMessageBoxComponent,
  ],
  templateUrl: './confirm-delivery-code.component.html',
  styleUrl: './confirm-delivery-code.component.scss',
})
export class ConfirmDeliveryCodeComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  @ViewChild('sessionFailed')
  sessionFailed!: DisplayMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('submitCodeMessageBox')
  submitCodeMessageBox!: SubmitMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private activatedRoute: ActivatedRoute,
    private invoiceService: InvoiceService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  private createFormGroup() {
    this.formGroup = this.fb.group({
      code: this.fb.control('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
      ]),
      mobile_no: this.fb.control('', [Validators.required]),
    });
  }
  private requestConfirmDeliveryCode(body: {
    code: number | string;
    mobile_no: string;
  }) {
    this.startLoading = true;
    this.invoiceService
      .confirmDeliveryCode(body)
      .then((result) => {
        if (
          typeof result.message === 'string' &&
          result.message.toLocaleLowerCase() === 'success'.toLocaleLowerCase()
        ) {
          let sal = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`auth.deliveryCode.confirmedSuccessfully`),
            5000
          );
          this.router.navigate(['/auth']);
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`auth.deliveryCode.failedToConfirmDeliveryCode`)
          );
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
  ngOnInit(): void {
    this.createFormGroup();
    this.activatedRoute.params.subscribe((params: any) => {
      if (params && params['id']) {
        let decoded = atob(params['id']);
        this.mobile_no.setValue(decoded);
      } else {
        AppUtilities.openDisplayMessageBox(
          this.sessionFailed,
          this.tr.translate(`defaults.failed`),
          this.tr.translate(`auth.deliveryCode.failedToFindDelivery`)
        );
      }
    });
  }
  submitForm() {
    if (this.formGroup.valid) {
      this.submitCodeMessageBox.title = this.tr.translate(`defaults.confirm`);
      this.submitCodeMessageBox.message =
        this.tr.translate(`actions.saveChanges`);
      this.submitCodeMessageBox.openDialog();
      this.submitCodeMessageBox.confirm.asObservable().subscribe(() => {
        this.requestConfirmDeliveryCode(this.formGroup.value);
      });
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get code() {
    return this.formGroup.get(`code`) as FormControl;
  }
  get mobile_no() {
    return this.formGroup.get(`mobile_no`) as FormControl;
  }
}
