import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import Chart from 'chart.js/auto';
import { BranchService } from 'src/app/core/services/bank/setup/branch.service';
import { Branch } from 'src/app/core/models/bank/branch';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    RouterModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class OverviewComponent implements OnInit, AfterViewInit {
  @ViewChild('overviewChart') overviewChart!: ElementRef;
  @ViewChild('invoiceSummary') invoiceSummary!: ElementRef;
  public branches: Branch[] = [];
  public customers: any[] = [];
  public overviewChartData: any;
  public invoiceSummaryData: any;
  public transactionsChartData: any;
  private createOverviewChart() {
    this.branchService
      .postBranchList({})
      .then((results: any) => {
        this.branches = results.response === 0 ? [] : results.response;
        let canvas = this.overviewChart.nativeElement as HTMLCanvasElement;
        let labels = this.branches.map((branch) => {
          return branch.Name.trim();
        });
        new Chart(canvas, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'branch',
                data: Array.from({ length: labels.length }, () =>
                  Math.floor(Math.random() * 100)
                ),
              },
            ],
          },
          options: {
            responsive: true,
            aspectRatio: 2.5,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (value, index, ticks) {
                    return value + ' TZS';
                  },
                  autoSkip: true,
                  maxTicksLimit: 1000,
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context: any) {
                    return context.formattedValue + ' /TZS';
                  },
                },
              },
            },
          },
        });
      })
      .catch((err) => {
        throw err;
      });
  }
  private createSummaryChart() {
    let canvas = this.invoiceSummary.nativeElement as HTMLCanvasElement;
    this.invoiceSummaryData = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Pending', 'In-Progress', 'Cancelled'],
        datasets: [
          {
            label: 'Total',
            data: [300, 50, 438, 653],
            hoverOffset: 4,
            backgroundColor: [
              'rgba(63, 81, 181, 0.5)',
              'rgba(77, 182, 172, 0.5)',
              'rgba(66, 133, 244, 0.5)',
              'rgba(156, 39, 176, 0.5)',
              'rgba(233, 30, 99, 0.5)',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        aspectRatio: 2.5,
        maintainAspectRatio: false,
      },
    });
  }
  constructor(private branchService: BranchService) {}
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.createOverviewChart();
    this.createSummaryChart();
  }
}
