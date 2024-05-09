import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { BreadcrumbService, BreadcrumbModule } from 'xng-breadcrumb';
import { fader } from './router-transition-animations';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fader],
  schemas: [NO_ERRORS_SCHEMA],
  imports: [
    HeaderComponent,
    RouterModule,
    FooterComponent,
    CommonModule,
    BreadcrumbModule,
  ],
})
export class MainComponent implements OnInit, AfterViewInit {
  @ViewChild('mainHeader') mainHeader!: HeaderComponent;
  constructor(
    private breadcrumbService: BreadcrumbService,
    private router: Router
  ) {}
  private routeLoaderListener() {
    this.router.events.subscribe((event) => {
      switch (true) {
        case event instanceof NavigationStart: {
          this.mainHeader.routeLoading = true;
          break;
        }
        case event instanceof NavigationEnd:
        case event instanceof NavigationCancel:
        case event instanceof NavigationError: {
          this.mainHeader.routeLoading = false;
          break;
        }
        default: {
          break;
        }
      }
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
      routeInterceptor(routeLink: any, breadcrumb: any) {
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
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.prepareBankBreadcrumbs();
    this.routeLoaderListener();
  }
  prepareRoute(outlet: RouterOutlet, animate: string): boolean {
    return (
      outlet && outlet.activatedRouteData && outlet.activatedRouteData[animate]
    );
  }
}
