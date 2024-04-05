import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { AppRoutingModule } from './app-routing.module';
import { NO_ERRORS_SCHEMA } from '@angular/compiler';
import { TranslocoRootModule } from './transloco-root.module';
import { BreadcrumbModule, BreadcrumbService } from 'xng-breadcrumb';
import { HeaderComponent } from './components/layouts/header/header.component';
import { FooterComponent } from './components/layouts/footer/footer.component';
import { CommonModule } from '@angular/common';
import { VendorHeaderComponent } from './components/layouts/vendor-header/vendor-header.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    TranslocoModule,
    BreadcrumbModule,
    HeaderComponent,
    FooterComponent,
    CommonModule,
    VendorHeaderComponent,
  ],
})
export class AppComponent implements OnInit {
  @ViewChild('noInternetModal') noInternetModal!: ElementRef;
  @ViewChild('connectedModal') connectedModal!: ElementRef;
  constructor(private breadcrumbService: BreadcrumbService) {}
  private verifyInternet() {
    window.addEventListener('online', () => {
      (this.connectedModal.nativeElement as HTMLDialogElement).showModal();
    });
    window.addEventListener('offline', () => {
      (this.noInternetModal.nativeElement as HTMLDialogElement).showModal();
    });
  }
  private prepareReportsRoutes() {
    this.breadcrumbService.set('@overview', 'Report(s)');
    this.breadcrumbService.set('@invoice', 'Invoice(s)');
    this.breadcrumbService.set('@userLog', 'User Log(s)');
    this.breadcrumbService.set('@customer', 'Vendor(s)');
    this.breadcrumbService.set('@audit', 'Audit');
    this.breadcrumbService.set('@transactions-id', { label: 'Details' });
    this.breadcrumbService.set('@payment', 'Payment(s)');
    this.breadcrumbService.set('@amendment', 'Amendment(s)');
    this.breadcrumbService.set('@transactions', {
      label: 'Transactions',
      routeInterceptor(routeLink, breadcrumb) {
        return routeLink.startsWith('/main') ? routeLink : `/main${routeLink}`;
      },
    });
  }
  private prepareSetupRoutes() {
    this.breadcrumbService.set('@country', 'Countries');
    this.breadcrumbService.set('@region', 'Regions');
    this.breadcrumbService.set('@district', 'Districts');
    this.breadcrumbService.set('@ward', 'Wards');
    this.breadcrumbService.set('@currency', 'Currencies');
    this.breadcrumbService.set('@designation', 'Designations');
    this.breadcrumbService.set('@branch', 'Branch');
    this.breadcrumbService.set('@question', 'Question(s)');
    this.breadcrumbService.set('@smtp', 'SMTP');
    this.breadcrumbService.set('@email', 'Email');
    this.breadcrumbService.set('@user', 'Bank user(s)');
    this.breadcrumbService.set('@language', 'Language');
    this.breadcrumbService.set('@suspense', 'Suspense account');
    this.breadcrumbService.set('@deposit', 'Deposit account');
  }
  private prepareCompanyRoutes() {
    this.breadcrumbService.set('@summary', 'Companies list');
    this.breadcrumbService.set('@inbox', 'Vendor approvals');
  }
  private prepareBankBreadcrumbs() {
    this.breadcrumbService.set('@home', 'Home');
    this.prepareReportsRoutes();
    this.prepareSetupRoutes();
    this.prepareCompanyRoutes();
  }
  private prepareVendorRoutes() {
    this.breadcrumbService.set('@vendor', 'Home');
    this.breadcrumbService.set('@customers', 'Customers');
    this.breadcrumbService.set('@view-customer', 'Details');
    this.breadcrumbService.set('@invoice-details', 'Invoice(s)');
    this.breadcrumbService.set('@generated-invoice', 'Generated Invoice(s)');
    this.breadcrumbService.set('@transactions', 'Transactions');
    this.breadcrumbService.set('@transactions-id', 'Details');
    this.breadcrumbService.set('@invoice', 'Invoice');
    this.breadcrumbService.set('@payments', 'Payment(s)');
    this.breadcrumbService.set('@customer', 'Customer');
  }
  ngOnInit(): void {
    if (this.isVendorRoute()) {
      this.prepareVendorRoutes();
    } else {
      this.prepareBankBreadcrumbs();
    }
    this.verifyInternet();
  }
  isAuthRoute() {
    return location.pathname.startsWith('/auth');
  }
  isBankRoute() {
    return location.pathname.startsWith('/vendor');
  }
  isVendorRoute() {
    return location.pathname.includes('/vendor');
  }
}
