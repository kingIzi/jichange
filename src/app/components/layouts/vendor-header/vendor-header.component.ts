import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LanguageSelectorComponent } from '../../language-selector/language-selector.component';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { LoginResponse } from 'src/app/core/models/login-response';
import { LoginService } from 'src/app/core/services/login.service';
import { DisplayMessageBoxComponent } from '../../dialogs/display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { NgxLoadingModule } from 'ngx-loading';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { Keepalive } from '@ng-idle/keepalive';

@Component({
  selector: 'app-vendor-header',
  templateUrl: './vendor-header.component.html',
  styleUrls: ['./vendor-header.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: { scope: 'auth' } }],
  imports: [
    CommonModule,
    RouterModule,
    LanguageSelectorComponent,
    TranslocoModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    NgxLoadingModule,
  ],
})
export class VendorHeaderComponent implements OnInit {
  private idleState = 'Not started.';
  private timedOut = false;
  private lastPing!: Date;
  public routeLoading: boolean = false;
  public formGroup!: FormGroup;
  public userProfile!: LoginResponse;
  private reportsMap = {
    overview: 0,
    transactionDetails: 1,
    invoiceDetails: 2,
    paymentDetails: 3,
    amendmentDetails: 4,
    cancelledDetails: 5,
    customerDetailReport: 6,
  };
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('timeoutWarning') timeoutWarning!: DisplayMessageBoxComponent;
  @ViewChild('timeOut') timeOut!: DisplayMessageBoxComponent;
  constructor(
    private tr: TranslocoService,
    private loginService: LoginService,
    private fb: FormBuilder,
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
      // timeOut.addEventListener('close', () => {
      //   this.requestLogout();
      // });
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
      if (currentPath.includes('/vendor')) {
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
  private switchRouterLinks(ind: number) {
    switch (ind) {
      case 0:
        return '/vendor/customers';
      case 1:
        return '/vendor/company';
      case 2:
        return '/vendor/invoice';
      case 3:
        return '/vendor/reports';
      default:
        return '/vendor';
    }
  }
  private async createHeaders() {
    this.formGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.tr.selectTranslate('vendorHeaders').subscribe((headers: any[]) => {
      headers.forEach((header, index) => {
        let group = this.fb.group({
          label: this.fb.control(header.name, []),
          dropdowns: this.fb.array([], []),
          rootLink: this.fb.control(this.switchRouterLinks(index), []),
        });
        (header.dropdowns as any[]).forEach((e, dropdownIndex) => {
          let dropdown = this.fb.group({
            label: this.fb.control(e, []),
            routerLink: this.fb.control(
              this.getHeaderRouterLink(index, dropdownIndex),
              []
            ),
            isActive: this.fb.control(false, []),
          });
          (group.get('dropdowns') as FormArray).push(dropdown);
        });
        this.headers.push(group);
      });
    });
  }
  private getHeaderRouterLink(bankIndex: number, dropdownIndex: number) {
    switch (bankIndex) {
      case 0:
        return '';
      case 1:
        return '';
      case 2:
        return this.switchInvoiceReportsLink(dropdownIndex);
      case 3:
        return this.swicthReportsLink(dropdownIndex);
      default:
        return '';
    }
  }
  private swicthReportsLink(index: number) {
    switch (index) {
      case this.reportsMap.overview:
        return '/vendor/reports/overview';
      case this.reportsMap.transactionDetails:
        return '/vendor/reports/transactions';
      case this.reportsMap.invoiceDetails:
        return '/vendor/reports/invoice';
      case this.reportsMap.paymentDetails:
        return '/vendor/reports/payments';
      case this.reportsMap.amendmentDetails:
        return '/vendor/reports/amendment';
      case this.reportsMap.cancelledDetails:
        return '/vendor/reports/cancelled';
      case this.reportsMap.customerDetailReport:
        return '/vendor/reports/customer';
      default:
        return '';
    }
  }
  private switchInvoiceReportsLink(index: number) {
    switch (index) {
      case 0:
        return '/vendor/invoice/list';
      case 1:
        return '/vendor/invoice/generated';
      default:
        return '';
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeaders();
  }
  getHeaderDropdownArray(index: number) {
    return this.headers.at(index).get('dropdowns') as FormArray;
  }
  routerClicked(ahref: HTMLAnchorElement, value: string) {
    ahref.blur();
  }
  verifyCurrentRoute(path: string) {
    return location.pathname.includes(path);
  }
  logout() {
    this.requestLogout();
  }
  get headers() {
    return this.formGroup.get('headers') as FormArray;
  }
}
