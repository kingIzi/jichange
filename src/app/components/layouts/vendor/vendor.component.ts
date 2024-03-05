import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterModule,
} from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { VendorHeaderComponent } from '../vendor-header/vendor-header.component';

@Component({
  selector: 'app-vendor',
  templateUrl: './vendor.component.html',
  styleUrls: ['./vendor.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, VendorHeaderComponent, FooterComponent],
})
export class VendorComponent implements OnInit, AfterViewInit {
  private initialRoute: string = '/vendor';
  public breadcrums: { url: string; name: string }[] = [];
  @ViewChild('vendorHeader') vendorHeader!: VendorHeaderComponent;
  constructor(private router: Router) {}
  ngOnInit(): void {
    this.breadcrums.push({
      url: this.initialRoute,
      name: this.switchRouteName(this.initialRoute),
    });
  }
  ngAfterViewInit(): void {
    this.routeLoaderListener();
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
}
