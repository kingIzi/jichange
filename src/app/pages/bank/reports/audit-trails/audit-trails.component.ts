import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-audit-trails',
  templateUrl: './audit-trails.component.html',
  styleUrls: ['./audit-trails.component.scss'],
  standalone: true,
  imports: [TranslocoModule, CommonModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class AuditTrailsComponent {
  public auditTrails: any[] = [];
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
}
