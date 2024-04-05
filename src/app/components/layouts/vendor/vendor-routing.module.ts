import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VendorComponent } from './vendor.component';

const routes: Routes = [
  {
    path: '',
    component: VendorComponent,
    children: [
      {
        path: '',
        data: { breadcrumb: { skip: true } },
        children: [
          {
            path: '',
            data: {
              breadcrumb: { alias: 'dashboard', skip: false },
              animationState: 'dashboard',
            },
            loadComponent: () =>
              import(
                '../../../pages/vendor/dashboard/dashboard.component'
              ).then((c) => c.DashboardComponent),
          },
          {
            path: 'customers',
            data: { breadcrumb: { skip: true } },
            children: [
              {
                path: '',
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/customers/customers-list/customers-list.component'
                  ).then((c) => c.CustomersListComponent),
                data: {
                  breadcrumb: { alias: 'customers', skip: false },
                  animationState: 'isLeft',
                },
              },
              {
                path: ':id',
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/customers/customer-view/customer-view.component'
                  ).then((c) => c.CustomerViewComponent),
                data: {
                  breadcrumb: { alias: 'view-customer', skip: false },
                  animationState: 'isRight',
                },
              },
            ],
          },
          {
            path: 'invoice',
            loadComponent: () =>
              import(
                '../../../pages/vendor/invoice-details/invoice-details.component'
              ).then((c) => c.InvoiceDetailsComponent),
            data: {
              breadcrumb: { alias: 'invoice-details', skip: false },
              animationState: 'invoice-details',
            },
          },
          {
            path: 'generated',
            loadComponent: () =>
              import(
                '../../../pages/vendor/generated-invoice-list/generated-invoice-list.component'
              ).then((c) => c.GeneratedInvoiceListComponent),
            data: {
              breadcrumb: { alias: 'generated-invoice', skip: false },
              animationState: 'generated-invoice',
            },
          },
          {
            path: 'reports',
            data: { breadcrumb: { skip: true } },
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full',
              },
              {
                path: 'overview',
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/reports/overview/overview.component'
                  ).then((c) => c.OverviewComponent),
                data: {
                  breadcrumb: { alias: 'overview', skip: false },
                  animationState: 'reports-module-1',
                },
              },
              {
                path: 'transactions',
                data: {
                  breadcrumb: { alias: 'transactions', skip: true },
                  animationState: 'reports-module-2',
                },
                children: [
                  {
                    path: '',
                    loadComponent: () =>
                      import(
                        '../../../pages/vendor/reports/transactions/list/list.component'
                      ).then((c) => c.ListComponent),
                    data: {
                      breadcrumb: { alias: 'transactions', skip: false },
                      animationState: 'isLeft',
                    },
                  },
                  {
                    path: ':id',
                    loadComponent: () =>
                      import(
                        '../../../pages/vendor/reports/transactions/details/details.component'
                      ).then((c) => c.DetailsComponent),
                    data: {
                      breadcrumb: { alias: 'transactions-id', skip: false },
                      animationState: 'isRight',
                    },
                  },
                ],
              },
              {
                path: 'invoice',
                data: {
                  breadcrumb: { alias: 'invoice', skip: false },
                  animationState: 'reports-module-3',
                },
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/reports/invoice-details/invoice-details.component'
                  ).then((c) => c.InvoiceDetailsComponent),
              },
              {
                path: 'payments',
                data: {
                  breadcrumb: { alias: 'payments', skip: false },
                  animationState: 'reports-module-4',
                },
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/reports/payment-details/payment-details.component'
                  ).then((p) => p.PaymentDetailsComponent),
              },
              {
                path: 'amendment',
                data: {
                  breadcrumb: { alias: 'amendment', skip: false },
                  animationState: 'reports-module-5',
                },
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/reports/amendments/amendments.component'
                  ).then((a) => a.AmendmentsComponent),
              },
              {
                path: 'customer',
                data: {
                  breadcrumb: { alias: 'customer', skip: false },
                  animationState: 'reports-module-6',
                },
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/reports/customer-report/customer-report.component'
                  ).then((c) => c.CustomerReportComponent),
              },
            ],
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorRoutingModule {}
