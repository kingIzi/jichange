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
  @Input() overviewCard!: {
    imgUrl: string;
    viewMoreLink: string;
    increase: boolean;
    statistic: number;
    lang: string;
    label: string;
  };
}
