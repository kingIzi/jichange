import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { LanguageSelectorComponent } from '../../language-selector/language-selector.component';
import { Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ChatAgentComponent } from '../../chat-agent/chat-agent.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BankUserProfileComponent } from '../../dialogs/bank-user-profile/bank-user-profile.component';
import { LoginService } from 'src/app/core/services/login.service';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TimeoutError } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from '../../dialogs/display-message-box/display-message-box.component';
import { NgxLoadingModule } from 'ngx-loading';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { Keepalive } from '@ng-idle/keepalive';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: { scope: 'auth' } }],
  imports: [
    LanguageSelectorComponent,
    RouterModule,
    TranslocoModule,
    CommonModule,
    ReactiveFormsModule,
    ChatAgentComponent,
    MatDialogModule,
    DisplayMessageBoxComponent,
    NgxLoadingModule,
  ],
})
export class HeaderComponent implements OnInit {
  private idleState = 'Not started.';
  private timedOut = false;
  private lastPing!: Date;
  public routeLoading: boolean = false;
  public formGroup!: FormGroup;
  public userProfile!: LoginResponse;
  private headersMap = {
    company: 0,
    setup: 1,
    reports: 2,
  };
  private companyMap = {
    summary: 0,
    inboxApproval: 1,
  };
  private setupMap = {
    country: 0,
    region: 1,
    district: 2,
    ward: 3,
    currency: 4,
    designation: 5,
    branch: 6,
    questionName: 7,
    smtp: 8,
    emailText: 9,
    bankUser: 10,
    language: 11,
    suspenseAccount: 12,
    depositAccount: 13,
  };
  private reportsMap = {
    overview: 0,
    transactionDetails: 1,
    paymentDetails: 2,
    invoiceDetails: 3,
    amendmentsDetails: 4,
    customerDetailReport: 5,
    userLogReport: 6,
    auditTrails: 7,
  };
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('timeoutWarning') timeoutWarning!: DisplayMessageBoxComponent;
  @ViewChild('timeOut') timeOut!: DisplayMessageBoxComponent;
  constructor(
    private tr: TranslocoService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private idle: Idle,
    private keepalive: Keepalive
  ) {
    let systemDefaultTimeout = 15 * 60;
    this.idle.setIdle(systemDefaultTimeout);
    this.idle.setTimeout(systemDefaultTimeout);
    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    this.idle.onIdleEnd.subscribe(() => {
      this.idleState = 'No longer idle.';
      this.timeoutWarning.closeDialog();
    });

    this.idle.onTimeout.subscribe(() => {
      this.idleState = 'Timed out!';
      this.timedOut = true;
      this.timeoutWarning.closeDialog();
      let timeOut = AppUtilities.openDisplayMessageBox(
        this.timeOut,
        this.tr.translate(`auth.sessionManagement.timedOut.timedOutTitle`),
        this.tr.translate(`auth.sessionManagement.timedOut.timeOutMessage`)
      );
      timeOut.addEventListener('close', () => {
        this.requestLogout();
      });
      this.cdr.detectChanges();
    });

    this.idle.onIdleStart.subscribe(() => {
      this.idleState = "You've gone idle!";
    });

    this.idle.onTimeoutWarning.subscribe((countdown) => {
      this.idleState = 'You will time out in ' + countdown + ' seconds!';
      AppUtilities.openDisplayMessageBox(
        this.timeoutWarning,
        this.tr.translate(`auth.sessionManagement.timedOut.timedOutTitle`),
        this.tr
          .translate(`auth.sessionManagement.timedOut.timeOutInXSeconds`)
          .replace('{}', countdown.toString())
      );
      this.cdr.detectChanges();
    });

    let interval = 30;
    this.keepalive.interval(interval);
    this.keepalive.onPing.subscribe(() => {
      this.lastPing = new Date();
    });

    this.router.events.subscribe((val) => {
      let currentPath = location.pathname;
      if (currentPath.includes('/main')) {
        this.idle.watch();
      } else {
        this.idle.stop();
      }
    });
  }
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createHeaders() {
    this.formGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    let activeLang = this.tr.getActiveLang().toLocaleLowerCase();
    this.tr.selectTranslation(activeLang).subscribe((headers) => {
      let bankHeaders: any[] = headers['bankHeaders'];
      bankHeaders.forEach((bankHeader, bankHeaderIndex) => {
        let header = this.fb.group({
          label: this.fb.control(bankHeader.name, []),
          dropdowns: this.fb.array([], []),
          rootLink: this.fb.control(
            this.switchHeaderRootLink(bankHeaderIndex),
            []
          ),
        });
        (bankHeader.dropdowns as any[]).forEach((e, dropdownIndex) => {
          let dropdown = this.fb.group({
            label: this.fb.control(e, []),
            routerLink: this.fb.control(
              this.getHeaderRouterLink(bankHeaderIndex, dropdownIndex),
              []
            ),
            isActive: this.fb.control(false, []),
          });
          (header.get('dropdowns') as FormArray).push(dropdown);
        });
        this.headers.push(header);
      });
    });
  }
  private switchHeaderRootLink(index: number) {
    switch (index) {
      case this.headersMap.company:
        return '/main/company';
      case this.headersMap.setup:
        return '/main/setup';
      case this.headersMap.reports:
        return '/main/reports';
      default:
        return '';
    }
  }
  private switchCompanyLink(index: number) {
    switch (index) {
      case this.companyMap.summary:
        return '/main/company/summary';
      case this.companyMap.inboxApproval:
        return '/main/company/inbox';
      default:
        return '';
    }
  }
  private switchSetupLinks(index: number) {
    switch (index) {
      case this.setupMap.country:
        return '/main/setup/country';
      case this.setupMap.region:
        return '/main/setup/region';
      case this.setupMap.district:
        return '/main/setup/district';
      case this.setupMap.ward:
        return '/main/setup/ward';
      case this.setupMap.currency:
        return '/main/setup/currency';
      case this.setupMap.designation:
        return '/main/setup/designation';
      case this.setupMap.branch:
        return '/main/setup/branch';
      case this.setupMap.questionName:
        return '/main/setup/question';
      case this.setupMap.smtp:
        return '/main/setup/smtp';
      case this.setupMap.emailText:
        return '/main/setup/email';
      case this.setupMap.bankUser:
        return '/main/setup/user';
      case this.setupMap.suspenseAccount:
        return '/main/setup/suspense';
      case this.setupMap.depositAccount:
        return '/main/setup/deposit';
      case this.setupMap.language:
        return '/main/setup/language';
      default:
        return '';
    }
  }
  private swicthReportsLink(index: number) {
    switch (index) {
      case this.reportsMap.overview:
        return '/main/reports/overview';
      case this.reportsMap.transactionDetails:
        return '/main/reports/transactions';
      case this.reportsMap.paymentDetails:
        return '/main/reports/payment';
      case this.reportsMap.invoiceDetails:
        return '/main/reports/invoice';
      case this.reportsMap.amendmentsDetails:
        return '/main/reports/amendment';
      case this.reportsMap.customerDetailReport:
        return '/main/reports/customer';
      case this.reportsMap.userLogReport:
        return '/main/reports/userlog';
      case this.reportsMap.auditTrails:
        return '/main/reports/audit';
      default:
        return '';
    }
  }
  private getHeaderRouterLink(bankIndex: number, dropdownIndex: number) {
    switch (bankIndex) {
      case this.headersMap.company:
        return this.switchCompanyLink(dropdownIndex);
      case this.headersMap.setup:
        return this.switchSetupLinks(dropdownIndex);
      case this.headersMap.reports:
        return this.swicthReportsLink(dropdownIndex);
      default:
        return '';
    }
  }
  private requestLogout() {
    this.routeLoading = true;
    this.loginService
      .logout({ userid: this.userProfile.Usno })
      .then((result) => {
        this.routeLoading = false;
        localStorage.clear();
        this.cdr.detectChanges();
        this.router.navigate(['/auth']);
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.routeLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeaders();
  }
  switchRouterLinks(ind: number) {
    return '';
  }
  getHeaderDropdownArray(index: number) {
    return this.headers.at(index).get('dropdowns') as FormArray;
  }
  verifyCurrentRoute(path: string) {
    return location.pathname.includes(path);
  }
  isActiveHeader(index: number) {
    let dropdowns = this.headers.at(index).get('dropdowns') as FormArray;
    return dropdowns.controls.find((e) => e.get('isActive')?.value);
  }
  routerClicked(ahref: HTMLAnchorElement) {
    ahref.blur();
  }
  logout() {
    this.requestLogout();
  }
  openProfileDialog() {
    let dialogRef = this.dialog.open(BankUserProfileComponent, {
      width: '400px',
    });
  }
  get headers() {
    return this.formGroup.get('headers') as FormArray;
  }
}
