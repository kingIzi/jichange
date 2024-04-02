import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { TranslocoModule } from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';

@Component({
  selector: 'app-customer-report',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    TableDateFiltersComponent,
    MatDialogModule,
    TranslocoModule,
  ],
  templateUrl: './customer-report.component.html',
  styleUrl: './customer-report.component.scss',
})
export class CustomerReportComponent implements OnInit {
  constructor() {}
  public customerDetailReports: any[] = [];
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  ngOnInit(): void {}
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
}
