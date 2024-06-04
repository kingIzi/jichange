import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { VendorHeaderComponent } from '../vendor-header/vendor-header.component';
import { vendorAnimations } from '../main/router-transition-animations';
import { BreadcrumbModule, BreadcrumbService } from 'xng-breadcrumb';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-vendor',
  templateUrl: './vendor.component.html',
  styleUrls: ['./vendor.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    VendorHeaderComponent,
    FooterComponent,
    BreadcrumbModule,
  ],
  animations: [vendorAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorComponent implements OnInit {
  @ViewChild('vendorHeader') vendorHeader!: VendorHeaderComponent;
  constructor(
    private breadcrumbService: BreadcrumbService,
    private router: Router,
    private tr: TranslocoService
  ) {}
  private prepareVendorRoutes() {
    this.breadcrumbService.set(
      '@profile',
      this.tr.translate(`vendorRoutes.profile`)
    );
    this.breadcrumbService.set(
      '@vendor',
      this.tr.translate(`vendorRoutes.home`)
    );
    this.breadcrumbService.set(
      '@customers',
      this.tr.translate(`vendorRoutes.customer`)
    );
    this.breadcrumbService.set(
      '@view-customer',
      this.tr.translate(`vendorRoutes.detail`)
    );
    this.breadcrumbService.set(
      '@view-customer-transactions',
      this.tr.translate(`vendorRoutes.viewCustomerTransactions`)
    );
    this.breadcrumbService.set(
      '@company',
      this.tr.translate(`vendorRoutes.users`)
    );
    this.breadcrumbService.set(
      '@invoice-created',
      this.tr.translate(`vendorRoutes.created`)
    );
    this.breadcrumbService.set(
      '@invoice-amendments',
      this.tr.translate(`vendorRoutes.amendment`)
    );
    this.breadcrumbService.set(
      '@invoice-cancelled',
      this.tr.translate(`vendorRoutes.cancelled`)
    );
    this.breadcrumbService.set(
      '@invoice-generated',
      this.tr.translate(`vendorRoutes.invoice`)
    );
    this.breadcrumbService.set(
      '@overview',
      this.tr.translate(`vendorRoutes.overview`)
    );
    this.breadcrumbService.set(
      '@transactions',
      this.tr.translate(`vendorRoutes.transactionsReport`)
    );
    this.breadcrumbService.set(
      '@transactions-id',
      this.tr.translate(`vendorRoutes.detail`)
    );
    this.breadcrumbService.set(
      '@invoice',
      this.tr.translate(`vendorRoutes.invoiceReport`)
    );
    this.breadcrumbService.set(
      '@payments',
      this.tr.translate(`vendorRoutes.paymentReport`)
    );
    this.breadcrumbService.set(
      '@amendment',
      this.tr.translate(`vendorRoutes.amendmentReport`)
    );
    this.breadcrumbService.set(
      '@customer',
      this.tr.translate(`vendorRoutes.customerReport`)
    );
  }
  private routeLoaderListener() {
    this.router.events.subscribe((event) => {
      switch (true) {
        case event instanceof NavigationStart: {
          this.vendorHeader.routeLoading = true;
          break;
        }
        case event instanceof NavigationEnd:
        case event instanceof NavigationCancel:
        case event instanceof NavigationError: {
          this.vendorHeader.routeLoading = false;
          break;
        }
        default: {
          break;
        }
      }
    });
  }
  ngOnInit(): void {
    this.prepareVendorRoutes();
    this.routeLoaderListener();
  }
  prepareRoute(outlet: RouterOutlet, animate: string): boolean {
    return (
      outlet && outlet.activatedRouteData && outlet.activatedRouteData[animate]
    );
  }
}
