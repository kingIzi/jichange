import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { BreadcrumbService, BreadcrumbModule } from 'xng-breadcrumb';
import { fader } from './router-transition-animations';
import { MainRoutingModule } from './main-routing.module';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  providers: [BreadcrumbService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, RouterModule, FooterComponent, CommonModule],
  animations: [fader],
})
export class MainComponent implements OnInit {
  constructor() {}
  ngOnInit(): void {}
  prepareRoute(outlet: RouterOutlet, animate: string): boolean {
    return (
      outlet && outlet.activatedRouteData && outlet.activatedRouteData[animate]
    );
  }
}
