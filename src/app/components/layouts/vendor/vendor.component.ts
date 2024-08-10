import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
import { NgxLoadingModule } from 'ngx-loading';

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
    NgxLoadingModule,
  ],
  animations: [vendorAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorComponent implements OnInit, AfterViewInit {
  public routeLoading: boolean = false;
  @ViewChild('vendorHeader') vendorHeader!: VendorHeaderComponent;
  @ViewChild('containerDoc', { static: true })
  containerDoc!: ElementRef<HTMLDivElement>;
  constructor(
    private breadcrumbService: BreadcrumbService,
    private router: Router,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef
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
    this.breadcrumbService.set(
      '@addInvoice',
      this.tr.translate(`vendorRoutes.addInvoice`)
    );
  }
  private routeLoaderListener() {
    this.router.events.subscribe((event) => {
      switch (true) {
        case event instanceof NavigationStart: {
          this.routeLoading = true;
          this.cdr.detectChanges();
          break;
        }
        case event instanceof NavigationEnd:
        case event instanceof NavigationCancel:
        case event instanceof NavigationError: {
          this.routeLoading = false;
          this.cdr.detectChanges();
          break;
        }
        default: {
          break;
        }
      }
    });
  }
  private hideNavBarOnScroll() {
    let containerDoc = this.containerDoc.nativeElement;
    let header = this.vendorHeader.header.nativeElement;
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
    this.routeLoaderListener();
    this.prepareVendorRoutes();
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
