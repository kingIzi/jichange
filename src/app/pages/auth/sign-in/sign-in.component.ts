import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, ViewChild } from '@angular/core';
import { Popover, Ripple, initTE } from 'tw-elements';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ControlNumberDetailsComponent } from 'src/app/components/dialogs/control-number-details/control-number-details.component';
import { VendorRegistrationComponent } from 'src/app/components/dialogs/vendor-registration/vendor-registration.component';
import { NgxLoadingModule } from 'ngx-loading';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoginResponse } from 'src/app/core/models/login-response';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { toggle } from '../auth-animations';
import { timer } from 'rxjs';
import { UserRoles } from 'src/app/core/enums/bank/user-roles';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  standalone: true,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: { scope: 'auth' } }],
  imports: [
    CommonModule,
    MatDialogModule,
    NgxLoadingModule,
    TranslocoModule,
    RouterModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    LoaderRainbowComponent,
  ],
})
export class SignInComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private requestService: RequestClientService,
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private router: Router
  ) {}
  private createForm() {
    this.formGroup = this.fb.group({
      userName: this.fb.control('', [Validators.required]),
      password: this.fb.control('', Validators.required),
    });
  }
  private formErrors(errorsPath: string = 'auth.loginForm.errors.dialogs') {
    if (this.userName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingUsername`)
      );
    } else if (this.password.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingPassword`)
      );
    }
  }
  private toRoute(response: LoginResponse, route: string) {
    localStorage.setItem('userProfile', JSON.stringify(response));
    this.router.navigate([route]);
  }
  private switchUserLogin(response: LoginResponse) {
    switch (response.role.toLocaleLowerCase()) {
      case UserRoles.COMPANYS.toLocaleLowerCase():
        this.toRoute(response, '/vendor');
        break;
      case UserRoles.BANK.toLocaleLowerCase():
        this.toRoute(response, '/main');
        break;
      default:
        this.toRoute(response, '/main');
        break;
    }
  }
  private signIn(value: { uname: string; pwd: string }) {
    this.startLoading = true;
    this.requestService
      .performPost(`/api/LoginUser/AddLogins`, value)
      .subscribe({
        next: (result) => {
          this.startLoading = false;
          let res = result as HttpDataResponse<LoginResponse>;
          if (!res.response.Usno) {
            AppUtilities.openDisplayMessageBox(
              this.displayMessageBox,
              this.translocoService.translate(
                `auth.loginForm.errors.dialogs.loginFailed`
              ),
              this.translocoService.translate(
                `auth.loginForm.errors.dialogs.usernamePasswordIncorrect`
              )
            );
            return;
          }
          this.switchUserLogin(res.response);
        },
        error: (err) => {
          this.startLoading = false;
          AppUtilities.noInternetError(
            this.displayMessageBox,
            this.translocoService
          );
          throw err;
        },
      });
  }
  private verifyControlNumber(
    result: { control: string },
    dialogRef: MatDialogRef<ControlNumberDetailsComponent>
  ) {
    this.startLoading = true;
    this.requestService.performPost(`/Invoice/getControl`, result).subscribe({
      next: (result) => {
        this.startLoading = false;
        dialogRef.componentInstance.controlNumberNotFound();
      },
      error: (err) => {
        this.startLoading = false;
        dialogRef.componentInstance.submitFailed();
        console.error(err);
        throw err;
      },
    });
  }
  ngOnInit(): void {
    initTE({ Popover, Ripple });
    this.createForm();
  }
  openControlNumberDetailsDialog() {
    let dialogRef = this.dialog.open(ControlNumberDetailsComponent, {
      width: '600px',
    });
    dialogRef.componentInstance.isLoading.asObservable().subscribe((result) => {
      this.verifyControlNumber(result, dialogRef);
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  openVendorRegistrationDialog() {
    let dialogRef = this.dialog.open(VendorRegistrationComponent, {
      width: '600px',
    });
    dialogRef.componentInstance.loadingStart.asObservable().subscribe(() => {
      if (!this.startLoading) {
        //this.startLoading = true;
      }
    });
    dialogRef.componentInstance.loadingEnd.asObservable().subscribe(() => {
      if (this.startLoading) {
        //this.startLoading = false;
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Vendor registration closed: ${result}`);
    });
  }
  submitSignInForm() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.formErrors();
      return;
    }
    this.signIn(this.formGroup.value);
  }
  get userName() {
    return this.formGroup.get('userName') as FormControl;
  }

  get password() {
    return this.formGroup.get('password') as FormControl;
  }
}
