import { CommonModule } from '@angular/common';
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
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { CompanyUser } from 'src/app/core/models/vendors/company-user';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CompanyUserService } from 'src/app/core/services/vendor/company-user.service';
import { catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';

@Component({
  selector: 'app-edit-company-user-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    PhoneNumberInputComponent,
  ],
  templateUrl: './edit-company-user-dialog.component.html',
  styleUrl: './edit-company-user-dialog.component.scss',
})
export class EditCompanyUserDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public userProfile!: LoginResponse;
  public companyUser!: CompanyUser;
  public formGroup!: FormGroup;
  private pageReady = new EventEmitter<void>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditCompanyUserDialogComponent>,
    private companyUserService: CompanyUserService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { companyUserId: number | string }
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private buildPage() {
    this.startLoading = true;
    let getCompanyUserByid = from(
      this.companyUserService.getCompanyUserByid({
        sno: this.data.companyUserId,
      })
    );
    let res = AppUtilities.pipedObservables(zip(getCompanyUserByid));
    res
      .then((results) => {
        let [companyUser] = results;
        if (
          companyUser.response &&
          typeof companyUser.response !== 'string' &&
          typeof companyUser.response !== 'number' &&
          typeof companyUser.response !== 'boolean'
        ) {
          this.companyUser = companyUser.response;
          this.pageReady.emit();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`errors.errorOccured`),
            this.tr.translate(`company.failedToRetrieveCompanyUser`)
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
  private createForm(user: CompanyUser) {
    this.formGroup = this.fb.group({
      pos: this.fb.control(user.Userpos, [Validators.required]),
      auname: this.fb.control(user.Username, [Validators.required]),
      uname: this.fb.control(user.Fullname, [Validators.required]),
      mob: this.fb.control(user.Mobile, [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      mail: this.fb.control(user.Email, [
        Validators.required,
        Validators.email,
      ]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      sno: this.fb.control(user.CompuserSno, [Validators.required]),
      compid: this.fb.control(this.userProfile.InstID.toString(), [
        Validators.required,
      ]),
      chname: this.fb.control(user.Usertype, []),
    });
  }
  private pageReadyEventHandler() {
    this.pageReady.asObservable().subscribe(() => {
      this.createForm(this.companyUser);
    });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.pageReadyEventHandler();
    this.buildPage();
  }
  closeDialog() {}
}
