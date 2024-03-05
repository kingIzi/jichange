import {
  Component,
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
  ],
})
export class ControlNumberDetailsComponent implements OnInit {
  public controlNumberFormGroup!: FormGroup;
  @Output() public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private dialogRef: MatDialogRef<ControlNumberDetailsComponent>,
    private fb: FormBuilder,
    private translocoService: TranslocoService
  ) {}
  ngOnInit(): void {
    this.createForm();
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
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingAccountNo`)
      );
    }
  }

  setControlNumberValue(value: string) {
    this.control.setValue(value.trim());
  }

  submitControlNumberForm() {
    if (this.controlNumberFormGroup.valid) {
      this.isLoading.emit(this.controlNumberFormGroup.value);
    }
    this.controlNumberFormGroup.markAllAsTouched();
    this.formErrors();
  }

  controlNumberNotFound() {
    let message = this.translocoService.translate(
      `auth.controlNumberDetails.form.errors.dialogs.notFoundMessage`
    );

    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.translocoService.translate(
        `auth.controlNumberDetails.form.errors.dialogs.notFound`
      ),
      message.replace('{}', this.control.value)
    );
  }

  submitFailed() {
    AppUtilities.noInternetError(this.displayMessageBox, this.translocoService);
  }

  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }

  get control() {
    return this.controlNumberFormGroup.get('control') as FormControl;
  }
}
