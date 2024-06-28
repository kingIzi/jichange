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
              reuseRoute: true,
            },
            loadComponent: () =>
              import(
                '../../../pages/vendor/dashboard/dashboard.component'
              ).then((c) => c.DashboardComponent),
          },
          {
            path: 'profile',
            data: {
              breadcrumb: { alias: 'profile', skip: false },
              animationState: 'profile',
            },
            loadComponent: () =>
              import('../../../pages/vendor/profile/profile.component').then(
                (p) => p.ProfileComponent
              ),
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
                  animationState: 'isLeft-1',
                  reuseRoute: true,
                },
              },
              {
                path: ':id',
                children: [
                  {
                    path: '',
                    loadComponent: () =>
                      import(
                        '../../../pages/vendor/customers/customer-view/customer-view.component'
                      ).then((c) => c.CustomerViewComponent),
                    data: {
                      breadcrumb: { alias: 'view-customer', skip: false },
                      animationState: 'isRight-1',
                      reuseRoute: true,
                    },
                  },
                  {
                    path: ':id',
                    loadComponent: () =>
                      import(
                        '../../../pages/bank/reports/transaction-details/transaction-details-view/transaction-details-view.component'
                      ).then((c) => c.TransactionDetailsViewComponent),
                    data: {
                      breadcrumb: {
                        alias: 'view-customer-transactions',
                        skip: false,
                        reuseRoute: true,
                      },
                      animationState: 'isRight-3',
                    },
                  },
                ],
              },
            ],
          },
          {
            path: 'company',
            data: { breadcrumb: { skip: true } },
            children: [
              {
                path: '',
                data: {
                  breadcrumb: { alias: 'company', skip: false },
                  animationState: 'company-module-1',
                },
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/company-users/company-users.component'
                  ).then((c) => c.CompanyUsersComponent),
              },
            ],
          },
          {
            path: 'invoice',
            data: { breadcrumb: { skip: true } },
            children: [
              {
                path: '',
                redirectTo: 'list',
                pathMatch: 'full',
              },
              {
                path: 'list',
                children: [
                  {
                    path: '',
                    loadComponent: () =>
                      import(
                        '../../../pages/vendor/invoice/created-invoice-list/list/created-invoice-list.component'
                      ).then((l) => l.CreatedInvoiceListComponent),
                    data: {
                      breadcrumb: { alias: 'invoice-created', skip: false },
                      animationState: 'invoice-module-1',
                    },
                  },
                  {
                    path: 'add',
                    loadComponent: () =>
                      import(
                        '../../../pages/vendor/invoice/created-invoice-list/add-invoice/add-invoice.component'
                      ).then((a) => a.AddInvoiceComponent),
                    data: {
                      breadcrumb: { alias: 'add', skip: false },
                      animationState: 'invoice-module-2',
                    },
                  },
                ],
              },
              {
                path: 'generated',
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/invoice/generated-invoice-list/generated-invoice-list.component'
                  ).then((c) => c.GeneratedInvoiceListComponent),
                data: {
                  breadcrumb: { alias: 'invoice-generated', skip: false },
                  animationState: 'invoice-module-3',
                },
              },
            ],
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
                      animationState: 'isLeft-2',
                      reuseRoute: true,
                    },
                  },
                  {
                    path: ':id',
                    loadComponent: () =>
                      import(
                        '../../../pages/bank/reports/transaction-details/transaction-details-view/transaction-details-view.component'
                      ).then((c) => c.TransactionDetailsViewComponent),
                    data: {
                      breadcrumb: {
                        alias: 'view-customer-transactions',
                        skip: false,
                        reuseRoute: true,
                      },
                      animationState: 'isRight-2',
                    },
                  },
                ],
              },
              {
                path: 'invoice',
                data: {
                  breadcrumb: { alias: 'invoice', skip: false },
                  animationState: 'reports-module-3',
                  reuseRoute: true,
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
                  reuseRoute: true,
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
                  reuseRoute: true,
                },
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/reports/amendments/amendments.component'
                  ).then((a) => a.AmendmentsComponent),
              },
              {
                path: 'cancelled',
                loadComponent: () =>
                  import(
                    '../../../pages/vendor/reports/invoice-cancelled/invoice-cancelled.component'
                  ).then((c) => c.InvoiceCancelledComponent),
                data: {
                  breadcrumb: { alias: 'invoice-cancelled', skip: false },
                  animationState: 'reports-module-6',
                  reuseRoute: true,
                },
              },
              {
                path: 'customer',
                data: {
                  breadcrumb: { alias: 'customer', skip: false },
                  animationState: 'reports-module-7',
                  reuseRoute: true,
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
