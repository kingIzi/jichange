import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-user-log-report',
  templateUrl: './user-log-report.component.html',
  styleUrls: ['./user-log-report.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class UserLogReportComponent {
  public userReportLogs: any[] = [];
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
}
