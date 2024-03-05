import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Collapse, Dropdown, Ripple, initTE } from 'tw-elements';
import { LanguageSelectorComponent } from '../../language-selector/language-selector.component';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    LanguageSelectorComponent,
    RouterModule,
    TranslocoModule,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @ViewChild('desktopSetupDropdown') desktopSetupDropdown!: ElementRef;
  public formGroup!: FormGroup;
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
    invoiceDetails: 2,
    customerDetailReport: 3,
    userLogReport: 4,
    auditTrails: 5,
  };
  constructor(
    private translocoService: TranslocoService,
    private fb: FormBuilder,
    private router: Router
  ) {}
  private createHeaders() {
    let bankHeaders: any[] = this.translocoService.translate('bankHeaders');
    this.formGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
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
      case this.reportsMap.invoiceDetails:
        return '/main/reports/invoice';
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
  ngAfterViewInit(): void {
    //let div = this.desktopSetupDropdown.nativeElement;
  }
  ngOnInit(): void {
    initTE({ Collapse, Dropdown, Ripple });
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
  get headers() {
    return this.formGroup.get('headers') as FormArray;
  }
}
