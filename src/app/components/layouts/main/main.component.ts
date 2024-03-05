import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { BreadcrumbService, BreadcrumbModule } from 'xng-breadcrumb';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  providers: [BreadcrumbService],
  imports: [
    HeaderComponent,
    RouterModule,
    FooterComponent,
    CommonModule,
    BreadcrumbModule,
  ],
})
export class MainComponent implements OnInit {
  private initialRoute: string = '/main';
  public breadcrums: { url: string; name: string }[] = [];
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  private switchRouteName(url: string) {
    switch (url) {
      case '/main':
        return 'Home';
      case '/main/inbox':
        return 'Inbox Approval';
      case '/main/summary':
        return 'Company summary';
      default:
        return '';
    }
  }
  private addBreadcrum(event: NavigationEnd) {
    let breadcrum = this.breadcrums.find((elem) => {
      return elem.url === event.url;
    });
    if (!breadcrum) {
      let name = this.switchRouteName(event.url);
      this.breadcrums.push({ url: event.url, name: name });
    } else {
      this.breadcrums = this.breadcrums.filter((elem) => {
        return elem.url === event.url;
      });
    }
  }
  ngOnInit(): void {
    //this.filterRouteChange();
    this.breadcrums.push({
      url: this.initialRoute,
      name: this.switchRouteName(this.initialRoute),
    });
    //localStorage.setItem('breadcrums', this.breadcrums.toLocaleString());
  }
  private buildBreadCrumb(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: any[] = []
  ): any {
    let label =
      route.routeConfig && route.routeConfig.data
        ? route.routeConfig.data['breadcrumb']
        : '';
    let path =
      route.routeConfig && route.routeConfig.data ? route.routeConfig.path : '';
    const lastRoutePart = path?.split('/').pop();
    const isDynamicRoute = lastRoutePart?.startsWith(':');
    if (isDynamicRoute && !!route.snapshot) {
      const paramName = lastRoutePart?.split(':')[1];
      if (lastRoutePart && paramName) {
        path = path?.replace(lastRoutePart, route.snapshot.params[paramName]);
        label = route.snapshot.params[paramName];
      }
    }
    const nextUrl = path ? `${url}/${path}` : url;

    const breadcrumb = {
      label: label,
      url: nextUrl,
    };
    const newBreadcrumbs = breadcrumb.label
      ? [...breadcrumbs, breadcrumb]
      : [...breadcrumbs];
    if (route.firstChild) {
      return this.buildBreadCrumb(route.firstChild, nextUrl, newBreadcrumbs);
    }
    return newBreadcrumbs;
  }
}
