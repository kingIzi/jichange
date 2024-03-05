import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';

const routes: Routes = [
  {
    path: '',
    component: ReportsComponent,
    children: [
      // {
      //   path: '',
      //   redirectTo: 'overview',
      //   pathMatch: 'full',
      //   //data: { animationState: 'overview-2' },
      // },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/overview.component').then(
            (c) => c.OverviewComponent
          ),
        data: { animationState: 'overview' },
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./transaction-details/transaction-details.component').then(
            (c) => c.TransactionDetailsComponent
          ),
        data: { animationState: 'transactions' },
      },
      {
        path: 'transactions/:id',
        loadComponent: () =>
          import(
            './transaction-details/transaction-details-view/transaction-details-view.component'
          ).then((c) => c.TransactionDetailsViewComponent),
        data: { animationState: 'transactions-id' },
      },
      {
        path: 'invoice',
        loadComponent: () =>
          import('./invoice-details/invoice-details.component').then(
            (m) => m.InvoiceDetailsComponent
          ),
        data: { animationState: 'invoice' },
      },
      {
        path: 'customer',
        loadComponent: () =>
          import(
            './customer-detail-report/customer-detail-report.component'
          ).then((m) => m.CustomerDetailReportComponent),
        data: { animationState: 'customer' },
      },
      {
        path: 'userlog',
        loadComponent: () =>
          import('./user-log-report/user-log-report.component').then(
            (m) => m.UserLogReportComponent
          ),
        data: { animationState: 'userlog' },
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./audit-trails/audit-trails.component').then(
            (m) => m.AuditTrailsComponent
          ),
        data: { animationState: 'audit' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
