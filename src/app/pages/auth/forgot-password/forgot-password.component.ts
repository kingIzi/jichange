import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  imports: [
    NgxLoadingModule,
    ReactiveFormsModule,
    TranslocoModule,
    CommonModule,
    RouterModule,
    DisplayMessageBoxComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'auth' }],
})
export class ForgotPasswordComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private requestService: RequestClientService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.createForm();
  }

  private createForm() {
    this.formGroup = this.fb.group({
      Sno: this.fb.control('', [Validators.required, Validators.email]),
    });
  }

  private sendPasswordReset(value: { Sno: string }) {
    this.startLoading = true;
    this.requestService.performPost(`/Forgot/Getemail`, value).subscribe({
      next: (result) => {
        this.startLoading = false;
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        this.startLoading = false;
        this.submitFailed();
        throw err;
      },
    });
  }

  private submitFailed() {
    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.translocoService.translate(`errors.errorOccured`),
      this.translocoService.translate(`errors.verifyConnection`)
    );
  }

  private formErrors(
    errorsPath: string = 'auth.forgotPassword.form.errors.dialogs'
  ) {
    if (this.Sno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingEmail`)
      );
    }
  }

  submitForm() {
    if (this.formGroup.valid) {
      this.sendPasswordReset(this.formGroup.value);
      return;
    }
    this.formGroup.markAllAsTouched();
    this.formErrors();
  }

  get Sno() {
    return this.formGroup.get('Sno') as FormControl;
  }
}
