import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NO_ERRORS_SCHEMA,
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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { DisplayMessageBoxComponent } from '../../display-message-box/display-message-box.component';
import { AddCancelForm } from 'src/app/core/models/vendors/forms/add-cancel-form';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';

@Component({
  selector: 'app-cancel-generated-invoice',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
  ],
  templateUrl: './cancel-generated-invoice.component.html',
  styleUrl: './cancel-generated-invoice.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
})
export class CancelGeneratedInvoiceComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  public cancelledInvoice = new EventEmitter<void>();
  @Output()
  @ViewChild('removeItem')
  removeItem!: ElementRef;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() invoiceId!: number | string;
  @Input() userId!: number | string;
  //public cancelInvoice = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef
  ) {}
  private createFormGroup() {
    this.formGroup = this.fb.group({
      sno: this.fb.control(this.invoiceId, [Validators.required]),
      reason: this.fb.control('', [Validators.required]),
      userid: this.fb.control(this.userId, [Validators.required]),
    });
  }
  private formErrors(
    path: string = 'invoice.createdInvoice.cancelInvoice.form.dialog'
  ) {
    if (this.reason.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`errors.invalidForm`),
        this.tr.translate(`${path}.reason`)
      );
    }
  }
  private failedToCancelInvoiceMessage() {
    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate('defaults.failed'),
      this.tr.translate(
        'invoice.createdInvoice.cancelInvoice.form.dialog.failedToCancelInvoice'
      )
    );
  }
  private requestCancelInvoice(body: AddCancelForm) {
    this.startLoading = true;
    this.invoiceService
      .cancelInvoice(body)
      .then((result) => {
        if (
          typeof result.response === 'string' ||
          (typeof result.response === 'number' && result.response === 0)
        ) {
          this.failedToCancelInvoiceMessage();
        } else if (typeof result.response === 'number' && result.response > 0) {
          let msg = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(
              `invoice.createdInvoice.cancelInvoice.cancelledSuccessfully`
            )
          );
          this.cancelledInvoice.emit();
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
  }
  openDialog() {
    let dialog = this.removeItem.nativeElement as HTMLDialogElement;
    return dialog.showModal();
  }
  closeDialog() {
    let dialog = this.removeItem.nativeElement as HTMLDialogElement;
    dialog.close();
  }
  cancelInvoiceClicked() {
    // this.cancelInvoice.emit();
    // this.closeDialog();
    if (this.formGroup.valid) {
      this.requestCancelInvoice(this.formGroup.value);
    } else {
      this.formGroup.markAllAsTouched();
      this.formErrors();
    }
  }
  get reason() {
    return this.formGroup.get(`reason`) as FormControl;
  }
}
