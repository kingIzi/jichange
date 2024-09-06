import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { firstValueFrom, from, Observable, of, zip } from 'rxjs';
//import { LoginResponse } from 'src/app/core/models/login-response';
import { LoginService } from 'src/app/core/services/login.service';
import { DisplayMessageBoxComponent } from '../../dialogs/display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { NgxLoadingModule } from 'ngx-loading';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { Keepalive } from '@ng-idle/keepalive';
import { CustomerService } from 'src/app/core/services/vendor/customers/customer.service';
import { Customer } from 'src/app/core/models/vendors/customer';
import { CompanyUserService } from 'src/app/core/services/vendor/company-user.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { RoleAct } from 'src/app/core/models/vendors/role-act';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { CompanyUser } from 'src/app/core/models/vendors/company-user';

type Header = {
  name: string;
  access: string[];
  dropdowns: {
    label: string;
    access: string[];
    routerLink: string;
  }[];
};

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
  public vendor$!: Observable<{ Comp_Mas_Sno: number; Company_Name: string }>;
  public routeLoading: boolean = false;
  public formGroup!: FormGroup;
  public roleActs: RoleAct[] = [];
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
  @ViewChild('header', { static: true }) header!: ElementRef<HTMLDivElement>;
  constructor(
    private appConfig: AppConfigService,
    private tr: TranslocoService,
    private loginService: LoginService,
    private invoiceService: InvoiceService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private idle: Idle,
    private keepalive: Keepalive,
    private companyUserService: CompanyUserService
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
  private assignRolesAct(result: HttpDataResponse<number | RoleAct[]>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      this.roleActs = [];
      let message = this.tr.translate(`auth.noRoleActsFound`);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        message
      );
    } else {
      this.roleActs = result.response as RoleAct[];
    }
  }
  private requestRolesAct() {
    let vendor = this.appConfig.getLoginResponse() as VendorLoginResponse;
    let t = from(
      this.companyUserService.requestRolesAct({ compid: vendor.InstID })
    );
    t.subscribe({
      next: (result) => {
        this.assignRolesAct(result);
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.routeLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
  }
  private requestLogout() {
    this.routeLoading = true;
    this.loginService
      .logout({ userid: this.getUserProfile().Usno })
      .then((result) => {
        this.routeLoading = false;
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
  }
  private isAdmin() {}
  private navigationBarItems(labels: Header[], companyUser: CompanyUser) {
    labels.forEach((label, index) => {
      let group = this.fb.group({
        label: this.fb.control(label.name, []),
        dropdowns: this.fb.array([], []),
        rootLink: this.fb.control(this.switchRouterLinks(index), []),
      });
      (label.dropdowns as any[]).forEach((dropdown, dropdownIndex) => {
        let col = this.fb.group({
          label: this.fb.control(dropdown.label, []),
          routerLink: this.fb.control(dropdown.routerLink, []),
          isActive: this.fb.control(false, []),
        });
        //(group.get('dropdowns') as FormArray).push(col);
        let found = this.roleActs.find(
          (e) => e.Sno === Number(companyUser.Userpos)
        );
        if (dropdown?.access?.includes(found?.Description)) {
          (group.get('dropdowns') as FormArray).push(col);
        }
      });
      this.headers.push(group);
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
  private buildPage() {
    let roleActs = from(
      this.companyUserService.requestRolesAct({
        compid: this.getUserProfile().InstID,
      })
    );
    let companyUserById = this.companyUserService.getCompanyUsersById({
      Sno: this.getUserProfile().Usno,
    });
    let vendorObs = from(
      this.invoiceService.getCompanyS({ compid: this.getUserProfile().InstID })
    );
    let langs = this.tr.selectTranslate('vendorHeaders');
    let res = AppUtilities.pipedObservables(
      zip(roleActs, langs, companyUserById, vendorObs)
    );
    res
      .then((results) => {
        let [roleActs, labels, companyUser, comp] = results;
        if (!AppUtilities.hasErrorResult(roleActs)) {
          this.assignRolesAct(roleActs);
        }
        if (
          !AppUtilities.hasErrorResult(comp) &&
          !AppUtilities.hasErrorResult(companyUser)
        ) {
          let vendor = comp.response as {
            Comp_Mas_Sno: number;
            Company_Name: string;
          };
          this.vendor$ = of(vendor);
          this.navigationBarItems(labels, companyUser.response as CompanyUser);
        }
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.createHeaders();
    this.buildPage();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  getHeaderDropdownArray(index: number) {
    return this.headers.at(index).get('dropdowns') as FormArray;
  }
  routerClicked(ahref: HTMLAnchorElement, value: string) {
    ahref.blur();
  }
  navItemClicked(path: string, index: number) {
    if (index === 0 || index === 1) {
      this.router.navigate([path]);
    }
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
