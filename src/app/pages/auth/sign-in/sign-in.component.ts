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
  ],
})
export class SignInComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private requestService: RequestClientService,
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private router: Router
  ) {}
  ngOnInit(): void {
    initTE({ Popover, Ripple });
    this.createForm();
  }
  private createForm() {
    this.formGroup = this.fb.group({
      uname: this.fb.control('', [Validators.required]),
      pwd: this.fb.control('', Validators.required),
    });
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
  private formErrors(errorsPath: string = 'auth.loginForm.errors.dialogs') {
    if (this.uname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingUsername`)
      );
    } else if (this.pwd.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingPassword`)
      );
    }
  }
  submitSignInForm() {
    if (this.formGroup.valid) {
      if (this.uname.value === 'bank' && this.pwd.value === 'bank') {
        this.router.navigate(['/main']);
      } else if (this.uname.value === 'vendor' && this.pwd.value === 'vendor') {
        this.router.navigate(['/vendor']);
      } else {
        AppUtilities.openDisplayMessageBox(
          this.displayMessageBox,
          this.translocoService.translate(
            `auth.loginForm.errors.dialogs.invalidFormError`
          ),
          this.translocoService.translate(
            'auth.loginForm.errors.dialogs.usernamePasswordIncorrect'
          )
        );
      }
    }
    this.formGroup.markAllAsTouched();
    this.formErrors();
  }
  private signIn(value: { uname: string; pwd: string }) {
    this.startLoading = true;
    this.requestService.performPost(`/Loginnew/addLogin`, value).subscribe({
      next: (result) => {
        this.startLoading = false;
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
        console.log(err);
        throw err;
      },
    });
  }

  get uname() {
    return this.formGroup.get('uname') as FormControl;
  }

  get pwd() {
    return this.formGroup.get('pwd') as FormControl;
  }
}
