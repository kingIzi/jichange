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
export class VendorComponent implements OnInit, AfterViewInit {
  private initialRoute: string = '/vendor';
  public breadcrums: { url: string; name: string }[] = [];
  @ViewChild('vendorHeader') vendorHeader!: VendorHeaderComponent;
  constructor(
    private breadcrumbService: BreadcrumbService,
    private router: Router
  ) {}
  private prepareVendorRoutes() {
    this.breadcrumbService.set('@vendor', 'Home');
    this.breadcrumbService.set('@customers', 'Customer(s)');
    this.breadcrumbService.set('@view-customer', 'Detail(s)');
    this.breadcrumbService.set('@company', 'User(s)');
    this.breadcrumbService.set('@invoice-amendments', 'Amendment(s)');
    this.breadcrumbService.set('@invoice-cancelled', 'Cancelled');
    this.breadcrumbService.set('@invoice-generated', 'Invoice(s)');
    this.breadcrumbService.set('@overview', 'Overview');
    this.breadcrumbService.set('@transactions', 'Transactions Report');
    this.breadcrumbService.set('@transactions-id', 'Detail(s)');
    this.breadcrumbService.set('@invoice', 'Invoice Report');
    this.breadcrumbService.set('@payments', 'Payment Report');
    this.breadcrumbService.set('@amendment', 'Amendment Report');
    this.breadcrumbService.set('@customer', 'Customer Report');
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
  private switchRouteName(url: string) {
    switch (url) {
      case '/vendor':
        return 'Home';
      default:
        return '';
    }
  }
  ngOnInit(): void {
    this.breadcrums.push({
      url: this.initialRoute,
      name: this.switchRouteName(this.initialRoute),
    });
  }
  ngAfterViewInit(): void {
    this.prepareVendorRoutes();
    this.routeLoaderListener();
  }
  prepareRoute(outlet: RouterOutlet, animate: string): boolean {
    return (
      outlet && outlet.activatedRouteData && outlet.activatedRouteData[animate]
    );
  }
}
