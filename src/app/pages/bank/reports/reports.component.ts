import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { routeTransitionAnimations } from './router-transition-animations';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: [routeTransitionAnimations],
})
export class ReportsComponent {
  prepareRoute(outlet: RouterOutlet) {
    return (
      outlet &&
      outlet.activatedRouteData &&
      outlet.activatedRouteData['animationState']
    );
  }
}
