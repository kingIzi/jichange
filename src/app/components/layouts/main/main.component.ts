import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
import { TranslocoService } from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';

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
    NgxLoadingModule,
  ],
})
export class MainComponent implements OnInit, AfterViewInit {
  public routeLoading: boolean = false;
  @ViewChild('mainHeader') mainHeader!: HeaderComponent;
  @ViewChild('containerDoc', { static: true })
  containerDoc!: ElementRef<HTMLDivElement>;
  constructor(
    private breadcrumbService: BreadcrumbService,
    private router: Router,
    private tr: TranslocoService
  ) {}
  private routeLoaderListener() {
    this.router.events.subscribe((event) => {
      switch (true) {
        case event instanceof NavigationStart: {
          this.routeLoading = true;
          break;
        }
        case event instanceof NavigationEnd:
        case event instanceof NavigationCancel:
        case event instanceof NavigationError: {
          this.routeLoading = false;
          break;
        }
        default: {
          //this.mainHeader.routeLoading = false;
          break;
        }
      }
    });
  }
  private prepareReportsRoutes() {
    this.breadcrumbService.set(
      '@overview',
      this.tr.translate(`bankRoutes.reports.overview`)
    );
    this.breadcrumbService.set(
      '@invoice',
      this.tr.translate(`bankRoutes.reports.invoice`)
    );
    this.breadcrumbService.set(
      '@userLog',
      this.tr.translate(`bankRoutes.reports.userLog`)
    );
    this.breadcrumbService.set(
      '@customer',
      this.tr.translate(`bankRoutes.reports.vendor`)
    );
    this.breadcrumbService.set(
      '@audit',
      this.tr.translate(`bankRoutes.reports.audit`)
    );
    this.breadcrumbService.set(
      '@transactions-id',
      this.tr.translate(`bankRoutes.reports.details`)
    );
    this.breadcrumbService.set(
      '@payment',
      this.tr.translate(`bankRoutes.reports.payments`)
    );
    this.breadcrumbService.set(
      '@amendment',
      this.tr.translate(`bankRoutes.reports.amendment`)
    );
    this.breadcrumbService.set(
      '@invoice-consolidated',
      this.tr.translate(`bankRoutes.reports.invoiceConsolidated`)
    );
    this.breadcrumbService.set(
      '@payment-consolidated',
      this.tr.translate(`bankRoutes.reports.paymentConsolidated`)
    );
    this.breadcrumbService.set(
      '@vendors',
      this.tr.translate(`bankRoutes.reports.vendorReport`)
    );
    this.breadcrumbService.set('@transactions', {
      label: this.tr.translate(`bankRoutes.reports.transaction`),
      routeInterceptor(routeLink: any, breadcrumb: any) {
        return routeLink.startsWith('/main') ? routeLink : `/main${routeLink}`;
      },
    });
  }
  private prepareSetupRoutes() {
    this.breadcrumbService.set(
      '@country',
      this.tr.translate(`bankRoutes.setup.country`)
    );
    this.breadcrumbService.set(
      '@region',
      this.tr.translate(`bankRoutes.setup.region`)
    );
    this.breadcrumbService.set(
      '@district',
      this.tr.translate(`bankRoutes.setup.district`)
    );
    this.breadcrumbService.set(
      '@ward',
      this.tr.translate(`bankRoutes.setup.ward`)
    );
    this.breadcrumbService.set(
      '@currency',
      this.tr.translate(`bankRoutes.setup.currencies`)
    );
    this.breadcrumbService.set(
      '@designation',
      this.tr.translate(`bankRoutes.setup.designation`)
    );
    this.breadcrumbService.set(
      '@branch',
      this.tr.translate(`bankRoutes.setup.branch`)
    );
    this.breadcrumbService.set(
      '@question',
      this.tr.translate(`bankRoutes.setup.question`)
    );
    this.breadcrumbService.set(
      '@smtp',
      this.tr.translate(`bankRoutes.setup.smtp`)
    );
    this.breadcrumbService.set(
      '@email',
      this.tr.translate(`bankRoutes.setup.email`)
    );
    this.breadcrumbService.set(
      '@user',
      this.tr.translate(`bankRoutes.setup.bankUser`)
    );
    this.breadcrumbService.set(
      '@language',
      this.tr.translate(`bankRoutes.setup.language`)
    );
    this.breadcrumbService.set(
      '@suspense',
      this.tr.translate(`bankRoutes.setup.suspense`)
    );
    this.breadcrumbService.set(
      '@deposit',
      this.tr.translate(`bankRoutes.setup.deposit`)
    );
  }
  private prepareCompanyRoutes() {
    this.breadcrumbService.set(
      '@summary',
      this.tr.translate(`bankRoutes.company.summary`)
    );
    this.breadcrumbService.set(
      '@inbox',
      this.tr.translate(`bankRoutes.company.inbox`)
    );
  }
  private prepareBankBreadcrumbs() {
    this.breadcrumbService.set('@home', this.tr.translate(`bankRoutes.home`));
    this.breadcrumbService.set(
      '@profile',
      this.tr.translate(`bankRoutes.profile`)
    );
    this.prepareReportsRoutes();
    this.prepareSetupRoutes();
    this.prepareCompanyRoutes();
  }
  private hideNavBarOnScroll() {
    let containerDoc = this.containerDoc.nativeElement;
    let header = this.mainHeader.header.nativeElement;
    let prevScrollpos = header.offsetHeight;
    let navbar = document.getElementById('navbar');
    this.containerDoc.nativeElement.onscroll = function () {
      let currentScrollPos = containerDoc.scrollTop;
      if (navbar && prevScrollpos > currentScrollPos) {
        navbar.style.top = '0px';
      } else if (navbar && prevScrollpos < currentScrollPos) {
        navbar.style.top = `-${header.clientHeight}px`;
      }
      prevScrollpos = currentScrollPos;
    };
  }
  ngOnInit(): void {
    this.prepareBankBreadcrumbs();
    this.routeLoaderListener();
  }
  ngAfterViewInit(): void {
    this.hideNavBarOnScroll();
  }
  prepareRoute(outlet: RouterOutlet, animate: string): boolean {
    return (
      outlet && outlet.activatedRouteData && outlet.activatedRouteData[animate]
    );
  }
}
