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
  ],
})
export class AppComponent implements OnInit {
  @ViewChild('noInternetModal') noInternetModal!: ElementRef;
  @ViewChild('connectedModal') connectedModal!: ElementRef;
  constructor(private breadcrumbService: BreadcrumbService) {}
  private prepareReportsRoutes() {
    this.breadcrumbService.set('@overview', 'Overview');
    this.breadcrumbService.set('@invoice', 'Invoice(s)');
    this.breadcrumbService.set('@userLog', 'User Log(s)');
    this.breadcrumbService.set('@customer', 'Customer(s)');
    this.breadcrumbService.set('@audit', 'Audit');
    this.breadcrumbService.set('@transactions-id', { label: 'Details' });
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
  private prepareBreadcrumbs() {
    this.prepareReportsRoutes();
    this.prepareSetupRoutes();
    this.prepareCompanyRoutes();
  }
  private verifyInternet() {
    window.addEventListener('online', () => {
      (this.connectedModal.nativeElement as HTMLDialogElement).showModal();
    });
    window.addEventListener('offline', () => {
      (this.noInternetModal.nativeElement as HTMLDialogElement).showModal();
    });
  }
  ngOnInit(): void {
    this.breadcrumbService.set('@Home', 'Home');
    this.prepareBreadcrumbs();
    this.verifyInternet();
  }
  isAuthRoute() {
    return location.pathname.startsWith('/auth');
  }
  isBankRoute() {
    return location.pathname.startsWith('/vendor');
  }
}
