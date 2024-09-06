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
import { TimeoutError } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from '../../dialogs/display-message-box/display-message-box.component';
import { NgxLoadingModule } from 'ngx-loading';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { Keepalive } from '@ng-idle/keepalive';
import {
  BankCompanyMap,
  BankHeaderMap,
  BankReportMap,
  BankSetupMap,
} from 'src/app/core/enums/bank/bank-headers-map';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';

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
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('timeoutWarning') timeoutWarning!: DisplayMessageBoxComponent;
  @ViewChild('timeOut') timeOut!: DisplayMessageBoxComponent;
  @ViewChild('header', { static: true }) header!: ElementRef<HTMLDivElement>;
  constructor(
    private appConfig: AppConfigService,
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
      this.requestLogout();
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
  private createHeaders() {
    type Header = {
      name: string;
      access: string[];
      dropdowns: {
        label: string;
        access: string[];
        routerLink: string;
      }[];
    };
    this.formGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    let activeLang = this.tr.getActiveLang().toLocaleLowerCase();
    this.tr.selectTranslation(activeLang).subscribe((headers) => {
      let bankHeaders: Header[] = headers['bankHeaders'];
      bankHeaders.forEach((bankHeader, bankHeaderIndex) => {
        if (
          this.getUserProfile().desig.toLocaleLowerCase() !==
            'Administrator'.toLocaleLowerCase() &&
          bankHeaderIndex === 1
        ) {
          return;
        }
        let header = this.fb.group({
          label: this.fb.control(bankHeader.name, []),
          dropdowns: this.fb.array([], []),
          rootLink: this.fb.control(
            this.switchHeaderRootLink(bankHeaderIndex),
            []
          ),
        });
        bankHeader.dropdowns.forEach((dropdown, dropdownIndex) => {
          let dropdownGroup = this.fb.group({
            label: this.fb.control(dropdown.label, []),
            routerLink: this.fb.control(dropdown.routerLink, []),
            isActive: this.fb.control(false, []),
          });
          // if (dropdownIndex !== 2) {
          //   (header.get('dropdowns') as FormArray).push(dropdownGroup);
          // }
          if (dropdown.access.includes(this.getUserProfile().desig)) {
            (header.get('dropdowns') as FormArray).push(dropdownGroup);
          }
        });
        this.headers.push(header);
      });
    });
  }
  private switchHeaderRootLink(index: number) {
    switch (index) {
      case BankHeaderMap.COMPANY:
        return '/main/company';
      case BankHeaderMap.SETUP:
        return '/main/setup';
      case BankHeaderMap.REPORTS:
        return '/main/reports';
      default:
        return '';
    }
  }
  private switchCompanyLink(index: number) {
    switch (index) {
      case BankCompanyMap.SUMMARY:
        return '/main/company/summary';
      case BankCompanyMap.INBOX_APPROVAL:
        return '/main/company/inbox';
      default:
        return '';
    }
  }
  private switchSetupLinks(index: number) {
    switch (index) {
      case BankSetupMap.COUNTRY:
        return '/main/setup/country';
      case BankSetupMap.REGION:
        return '/main/setup/region';
      case BankSetupMap.DISTRICT:
        return '/main/setup/district';
      case BankSetupMap.WARD:
        return '/main/setup/ward';
      case BankSetupMap.CURRENCY:
        return '/main/setup/currency';
      case BankSetupMap.DESIGNATION:
        return '/main/setup/designation';
      case BankSetupMap.BRANCH:
        return '/main/setup/branch';
      case BankSetupMap.SMTP:
        return '/main/setup/smtp';
      case BankSetupMap.EMAIL_TEXT:
        return '/main/setup/email';
      case BankSetupMap.BANK_USER:
        return '/main/setup/user';
      case BankSetupMap.SUSPENSE_ACCOUNT:
        return '/main/setup/suspense';
      case BankSetupMap.DEPOSIT_ACCOUNT:
        return '/main/setup/deposit';
      default:
        return '';
    }
  }
  private swicthReportsLink(index: number) {
    switch (index) {
      case BankReportMap.OVERVIEW:
        return '/main/reports/overview';
      case BankReportMap.TRANSACTION_DETAILS:
        return '/main/reports/transactions';
      case BankReportMap.PAYMENT_DETAILS:
        return '/main/reports/payment';
      case BankReportMap.INVOICE_DETAILS:
        return '/main/reports/invoice';
      case BankReportMap.AMENDMENT_DETAILS:
        return '/main/reports/amendment';
      case BankReportMap.CUSTOMER_DETAILS:
        return '/main/reports/customer';
      case BankReportMap.VENDORS:
        return '/main/reports/vendors';
      case BankReportMap.INVOICE_CONSOLIDATED:
        return '/main/reports/invoice-consolidated';
      case BankReportMap.USER_LOG_REPORT:
        return '/main/reports/userlog';
      case BankReportMap.AUDIT_TRAILS:
        return '/main/reports/audit';
      default:
        return '';
    }
  }
  private getHeaderRouterLink(bankIndex: number, dropdownIndex: number) {
    switch (bankIndex) {
      case BankHeaderMap.COMPANY:
        return this.switchCompanyLink(dropdownIndex);
      case BankHeaderMap.SETUP:
        return this.switchSetupLinks(dropdownIndex);
      case BankHeaderMap.REPORTS:
        return this.swicthReportsLink(dropdownIndex);
      default:
        return '';
    }
  }
  private requestLogout() {
    this.routeLoading = true;
    this.loginService
      .logout({ userid: this.getUserProfile().Usno })
      .then((result) => {
        this.routeLoading = false;
        //localStorage.clear();
        this.appConfig.clearSessionStorage();
        this.cdr.detectChanges();
        this.router.navigate(['/auth']);
        location.reload();
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
    this.createHeaders();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
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
