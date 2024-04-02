import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    TableDateFiltersComponent,
    MatDialogModule,
    TranslocoModule,
  ],
  templateUrl: './invoice-details.component.html',
  styleUrl: './invoice-details.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class InvoiceDetailsComponent {
  constructor(private dialog: MatDialog) {}
  public invoiceDetails: any[] = [];
}
