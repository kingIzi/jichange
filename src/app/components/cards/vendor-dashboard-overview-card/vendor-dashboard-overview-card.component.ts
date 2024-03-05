import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-vendor-dashboard-overview-card',
  templateUrl: './vendor-dashboard-overview-card.component.html',
  styleUrls: ['./vendor-dashboard-overview-card.component.scss'],
  standalone: true,
  imports: [RouterModule, TranslocoModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/dashboard', alias: 'panel' },
    },
  ],
})
export class VendorDashboardOverviewCardComponent {
  @Input() statistic: number = 0;
  @Input() label: string = 'Transaction';
  @Input() imgUrl: string = '';
  @Input() viewMoreLink: string = '';
  @Input() increase: boolean = true;
  @Input() lang: string = '';
}
