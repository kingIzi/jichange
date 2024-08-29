import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Popover, Ripple, initTE } from 'tw-elements';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ControlNumberDetailsComponent } from 'src/app/components/dialogs/control-number-details/control-number-details.component';
import { VendorRegistrationComponent } from 'src/app/components/dialogs/vendor-registration/vendor-registration.component';
import { NgxLoadingModule } from 'ngx-loading';
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
//import { LoginResponse } from 'src/app/core/models/login-response';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { UserRoles } from 'src/app/core/enums/bank/user-roles';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { LoginService } from 'src/app/core/services/login.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import {
  BankLoginResponse,
  VendorLoginResponse,
} from 'src/app/core/models/login-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

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
    LoaderInfiniteSpinnerComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private loginService: LoginService
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
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.missingUsername`)
      );
    } else if (this.password.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.missingPassword`)
      );
    }
  }
  private toRoute(
    response: VendorLoginResponse | BankLoginResponse,
    route: string
  ) {
    //localStorage.setItem('userProfile', JSON.stringify(response));
    this.appConfig.setItem('userProfile', JSON.stringify(response));
    this.cdr.detectChanges();
    this.router.navigate([route]);
  }
  private switchUserLogin(response: VendorLoginResponse | BankLoginResponse) {
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
  private loginFailedMessageDialog() {
    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate(`auth.loginForm.errors.dialogs.loginFailed`),
      this.tr.translate(
        `auth.loginForm.errors.dialogs.usernamePasswordIncorrect`
      )
    );
    return;
  }
  private requestSignIn(value: { uname: string; pwd: string }) {
    this.startLoading = true;
    this.loginService
      .loginUser(value)
      .then((results) => {
        if (!results.response.Usno) {
          this.loginFailedMessageDialog();
        } else {
          this.switchUserLogin(results.response);
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
    initTE({ Popover, Ripple });
    this.createForm();
  }
  openControlNumberDetailsDialog() {
    let dialogRef = this.dialog.open(ControlNumberDetailsComponent, {
      width: '600px',
      disableClose: true,
    });
  }
  openVendorRegistrationDialog() {
    let dialogRef = this.dialog.open(VendorRegistrationComponent, {
      width: '600px',
      disableClose: true,
    });
    dialogRef.componentInstance.addedVendor.asObservable().subscribe(() => {
      dialogRef.close();
    });
  }
  submitSignInForm() {
    if (this.formGroup.valid) {
      this.requestSignIn(this.formGroup.value);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get userName() {
    return this.formGroup.get('userName') as FormControl;
  }
  get password() {
    return this.formGroup.get('password') as FormControl;
  }
}
