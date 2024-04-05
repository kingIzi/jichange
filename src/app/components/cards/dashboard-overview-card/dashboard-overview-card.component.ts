import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-dashboard-overview-card',
  templateUrl: './dashboard-overview-card.component.html',
  styleUrls: ['./dashboard-overview-card.component.scss'],
  standalone: true,
  imports: [RouterModule, TranslocoModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/dashboard', alias: 'dashboard' },
    },
  ],
})
export class DashboardOverviewCardComponent {
  @Input() statistic: number = 0;
  @Input() label: string = 'Transaction';
  @Input() imgUrl: string = '';
  @Input() viewMoreLink: string = '';
  @Input() increase: boolean = true;
  @Input() lang: string = '';
}
