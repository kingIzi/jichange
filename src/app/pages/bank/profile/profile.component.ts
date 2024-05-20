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
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  query,
  group,
  animateChild,
} from '@angular/animations';
import { SubmitMessageBoxComponent } from 'src/app/components/dialogs/submit-message-box/submit-message-box.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { BankService } from 'src/app/core/services/bank/setup/bank/bank.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TimeoutError } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { EmployeeDetail } from 'src/app/core/models/bank/setup/employee-detail';
import { LoginResponse } from 'src/app/core/models/login-response';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BankUserDialogComponent } from 'src/app/components/dialogs/bank/setup/bank-user-dialog/bank-user-dialog.component';

enum PROFILE_OPTIONS {
  GENERAL,
  SECURITY,
  LANGUAGE,
}

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'auth', alias: 'auth' },
    },
  ],
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
  public employeeDetail!: EmployeeDetail;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public PROFILE_OPTIONS: typeof PROFILE_OPTIONS = PROFILE_OPTIONS;
  public userProfile!: LoginResponse;
  @ViewChild('submitMessageBox') submitMessageBox!: SubmitMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private bankUserService: BankService,
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
      lname: this.fb.control('', [Validators.required]),
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
      fname: this.employeeDetail.First_Name,
      lname: this.employeeDetail.Last_name,
      email: this.employeeDetail.Email_Address,
      role: this.userProfile.role,
    });
    this.generalFormGroup.get('role')?.disable();
  }
  private requestEmployeeDetail(body: { sno: string | number }) {
    this.startLoading = true;
    this.bankUserService
      .postFetchEmployeeDetail(body)
      .then((result) => {
        if (
          result.message.toLocaleLowerCase() === 'success'.toLocaleLowerCase()
        ) {
          this.employeeDetail = result.response;
          this.setGeneralFormGroupData();
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
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
        alert('log user out');
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
    let dialogRef = this.dialog.open(BankUserDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        Detail_Id: this.employeeDetail.Detail_Id,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      this.requestEmployeeDetail({ sno: this.employeeDetail.Detail_Id });
      dialogRef.close();
    });
  }
  setActiveTab(index: number) {
    this.selectedTabIndex = index;
  }
}
