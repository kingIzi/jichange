import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  TranslocoService,
  TRANSLOCO_SCOPE,
  TranslocoModule,
} from '@ngneat/transloco';
import { TimeoutError } from 'rxjs';
import { CompanyUsersDialogComponent } from 'src/app/components/dialogs/Vendors/company-users-dialog/company-users-dialog.component';
import { BankUserDialogComponent } from 'src/app/components/dialogs/bank/setup/bank-user-dialog/bank-user-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SubmitMessageBoxComponent } from 'src/app/components/dialogs/submit-message-box/submit-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { EmployeeDetail } from 'src/app/core/models/bank/setup/employee-detail';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CompanyUser } from 'src/app/core/models/vendors/company-user';
import { BankService } from 'src/app/core/services/bank/setup/bank/bank.service';
import { CompanyUserService } from 'src/app/core/services/vendor/company-user.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
//import { Tab, initTE } from 'tw-elements';

enum PROFILE_OPTIONS {
  GENERAL,
  SECURITY,
  LANGUAGE,
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    SubmitMessageBoxComponent,
    ReactiveFormsModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    MatDialogModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('inOutAnimation', [
      transition(':enter', [
        style({ opacity: 0, position: 'relative' }),
        animate('0.5s ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ opacity: 1, position: 'absolute' }),
        animate('0.5s ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'auth', alias: 'auth' },
    },
  ],
})
export class ProfileComponent implements OnInit {
  public languages: { imgUrl: string; code: string; name: string }[] = [
    {
      imgUrl: '/assets/img/tz.png',
      code: 'sw',
      name: 'Swahili',
    },
    {
      imgUrl: '/assets/img/gb.png',
      code: 'en',
      name: 'English',
    },
  ];
  public startLoading: boolean = false;
  //public formGroups: FormGroup[] = [];
  public generalFormGroup!: FormGroup;
  public languageFormGroup!: FormGroup;
  public selectedTabIndex: number = 0;
  public activeTabs: any[] = [];
  //public employeeDetail: typeof EmployeeDetail = EmployeeDetail;
  public companyUser!: CompanyUser;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public PROFILE_OPTIONS: typeof PROFILE_OPTIONS = PROFILE_OPTIONS;
  public userProfile!: LoginResponse;
  @ViewChild('submitMessageBox') submitMessageBox!: SubmitMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    //private bankUserService: BankService,
    private companyUserService: CompanyUserService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createGeneralFormGroup() {
    this.generalFormGroup = this.fb.group({
      fname: this.fb.control('', [Validators.required]),
      mobile: this.fb.control('', [Validators.required]),
      email: this.fb.control('', [Validators.required, Validators.email]),
      role: this.fb.control(this.userProfile.role, [Validators.required]),
    });
  }
  private createLanguageFormGroup() {
    this.languageFormGroup = this.fb.group({
      lang: this.fb.control(this.tr.getActiveLang().toLocaleLowerCase(), [
        Validators.required,
      ]),
    });
  }
  private prepareActiveTabs() {
    this.tr
      .selectTranslate(`profile.activeTabs`, {}, this.scope)
      .subscribe((activeTabs: string[]) => {
        this.activeTabs = activeTabs;
      });
  }
  private setGeneralFormGroupData() {
    this.generalFormGroup.setValue({
      fname: this.companyUser.Fullname ?? '',
      mobile: this.companyUser.Mobile,
      email: this.companyUser.Email,
      role: this.userProfile.role,
    });
    this.generalFormGroup.disable();
    //this.generalFormGroup.get('role')?.disable();
  }
  private requestEmployeeDetail(body: { sno: string | number }) {
    this.startLoading = true;
    this.companyUserService
      .getCompanyUserByid(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response !== 'number' &&
          typeof result.response !== 'boolean'
        ) {
          this.companyUser = result.response as CompanyUser;
          this.setGeneralFormGroupData();
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
    this.parseUserProfile();
    this.createGeneralFormGroup();
    this.createLanguageFormGroup();
    this.prepareActiveTabs();
    this.activatedRoute.params.subscribe((params) => {
      if (params['id']) {
        this.requestEmployeeDetail({ sno: params['id'] });
      } else {
        this.router.navigate(['/auth']);
      }
    });
  }
  saveLanguageClicked() {
    if (
      this.tr.getActiveLang().toLocaleLowerCase() !==
      this.languageFormGroup.get('lang')?.value.toLocaleLowerCase()
    ) {
      let lang = this.languages.find(
        (l) =>
          l.code.toLocaleLowerCase() ===
          this.languageFormGroup.get('lang')?.value.toLocaleLowerCase()
      );
      if (lang) {
        let dialog = AppUtilities.openSubmitMessageBox(
          this.submitMessageBox,
          this.activeTabs[PROFILE_OPTIONS.LANGUAGE].changeLanguage,
          this.activeTabs[PROFILE_OPTIONS.LANGUAGE].sureLanguage.replace(
            '{}',
            lang.name
          )
        );
        dialog.confirm.asObservable().subscribe(() => {
          this.tr.setActiveLang(lang.code);
          localStorage.setItem('activeLang', lang.code);
          location.reload();
        });
      }
    }
  }
  openEditBankUserForm() {
    let dialogRef = this.dialog.open(CompanyUsersDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        companyUserId: this.companyUser.CompuserSno,
      },
    });
    dialogRef.componentInstance.addedUser.asObservable().subscribe(() => {
      dialogRef.close();
      this.activatedRoute.params.subscribe((params) => {
        if (params['id']) {
          this.requestEmployeeDetail({ sno: params['id'] });
        } else {
          this.router.navigate(['/auth']);
        }
      });
    });
  }
  setActiveTab(index: number) {
    this.selectedTabIndex = index;
  }
}
