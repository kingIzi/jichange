import { NgModule } from '@angular/core';
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { DefaultRouteReuseStrategy } from 'src/app/utilities/default-route-reuse-strategy';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
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
              import('../../../pages/bank/dashboard/dashboard.component').then(
                (m) => m.DashboardComponent
              ),
          },
          {
            path: 'profile/:id',
            data: {
              breadcrumb: { alias: 'profile', skip: false },
              animationState: 'profile',
            },
            loadComponent: () =>
              import('../../../pages/bank/profile/profile.component').then(
                (p) => p.ProfileComponent
              ),
          },
        ],
      },
      {
        path: 'company',
        data: { breadcrumb: { skip: true } },
        children: [
          {
            path: '',
            redirectTo: 'summary',
            pathMatch: 'full',
          },
          // {
          //   path: 'summary',
          //   loadComponent: () =>
          //     import(
          //       '../../../pages/bank/company/summary/summary.component'
          //     ).then((c) => c.SummaryComponent),
          //   data: {
          //     breadcrumb: { alias: 'summary', skip: false },
          //     animationState: 'company-module-1',
          //   },
          // },
          {
            path: 'summary',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import(
                    '../../../pages/bank/company/summary/list/summary.component'
                  ).then((c) => c.SummaryComponent),
                data: {
                  breadcrumb: { alias: 'summary', skip: false },
                  animationState: 'company-module-1',
                },
              },
              {
                path: 'add',
                loadComponent: () =>
                  import(
                    '../../../pages/bank/company/summary/add-vendor/add-vendor.component'
                  ).then((s) => s.AddVendorComponent),
                data: {
                  breadcrumb: { alias: 'summary', skip: false },
                  animationState: 'sub-summary-module',
                },
              },
            ],
          },
          {
            path: 'inbox',
            loadComponent: () =>
              import(
                '../../../pages/bank/company/inbox-approval/inbox-approval.component'
              ).then((c) => c.InboxApprovalComponent),
            data: {
              breadcrumb: { alias: 'inbox', skip: false },
              animationState: 'company-module-2',
            },
          },
        ],
      },
      {
        path: 'setup',
        data: { breadcrumb: { skip: true } },
        children: [
          {
            path: '',
            redirectTo: 'country',
            pathMatch: 'full',
          },
          {
            path: 'country',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/country-list/country-list.component'
              ).then((m) => m.CountryListComponent),
            data: {
              breadcrumb: { alias: 'country', skip: false },
              animationState: 'setup-module-1',
            },
          },
          {
            path: 'region',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/region-list/region-list.component'
              ).then((m) => m.RegionListComponent),
            data: {
              breadcrumb: { alias: 'region', skip: false },
              animationState: 'setup-module-2',
            },
          },
          {
            path: 'district',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/district-list/district-list.component'
              ).then((m) => m.DistrictListComponent),
            data: {
              breadcrumb: { alias: 'district', skip: false },
              animationState: 'setup-module-3',
            },
          },
          {
            path: 'ward',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/ward-list/ward-list.component'
              ).then((m) => m.WardListComponent),
            data: {
              breadcrumb: { alias: 'ward', skip: false },
              animationState: 'setup-module-4',
            },
          },
          {
            path: 'currency',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/currency-list/currency-list.component'
              ).then((m) => m.CurrencyListComponent),
            data: {
              breadcrumb: { alias: 'currency', skip: false },
              animationState: 'setup-module-5',
            },
          },
          {
            path: 'designation',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/designation-list/designation-list.component'
              ).then((m) => m.DesignationListComponent),
            data: {
              breadcrumb: { alias: 'designation', skip: false },
              animationState: 'setup-module-6',
            },
          },
          {
            path: 'branch',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/branch-list/branch-list.component'
              ).then((m) => m.BranchListComponent),
            data: {
              breadcrumb: { alias: 'branch', skip: false },
              animationState: 'setup-module-7',
            },
          },
          {
            path: 'question',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/question-name-list/question-name-list.component'
              ).then((m) => m.QuestionNameListComponent),
            data: {
              breadcrumb: { alias: 'question', skip: false },
              animationState: 'setup-module-8',
            },
          },
          {
            path: 'smtp',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/smtp-list/smtp-list.component'
              ).then((m) => m.SmtpListComponent),
            data: {
              breadcrumb: { alias: 'smtp', skip: false },
              animationState: 'setup-module-9',
            },
          },
          {
            path: 'email',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/email-text-list/email-text-list.component'
              ).then((m) => m.EmailTextListComponent),
            data: {
              breadcrumb: { alias: 'email', skip: false },
              animationState: 'setup-module-10',
            },
          },
          {
            path: 'user',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/bank-user-list/bank-user-list.component'
              ).then((m) => m.BankUserListComponent),
            data: {
              breadcrumb: { alias: 'user', skip: false },
              animationState: 'setup-module-11',
            },
          },
          {
            path: 'language',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/language-setup/language-setup.component'
              ).then((c) => c.LanguageSetupComponent),
            data: {
              breadcrumb: { alias: 'language', skip: false },
              animationState: 'setup-module-12',
            },
          },
          {
            path: 'suspense',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/suspense-account-list/suspense-account-list.component'
              ).then((c) => c.SuspenseAccountListComponent),
            data: {
              breadcrumb: { alias: 'suspense', skip: false },
              animationState: 'setup-module-13',
            },
          },
          {
            path: 'deposit',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/deposit-account-list/deposit-account-list.component'
              ).then((c) => c.DepositAccountListComponent),
            data: {
              breadcrumb: { alias: 'deposit', skip: false },
              animationState: 'setup-module-14',
            },
          },
          {
            path: 'sms-settings',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/sms-settings-list/sms-settings-list.component'
              ).then((s) => s.SmsSettingsListComponent),
            data: {
              breadcrumb: { alias: 'sms-settings', skip: false },
              animationState: 'setup-module-15',
            },
          },
          {
            path: 'sms-text',
            loadComponent: () =>
              import(
                '../../../pages/bank/setup/sms-text-list/sms-text-list.component'
              ).then((s) => s.SmsTextListComponent),
            data: {
              breadcrumb: { alias: 'sms-text', skip: false },
              animationState: 'setup-module-16',
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
                '../../../pages/bank/reports/overview/overview.component'
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
                    '../../../pages/bank/reports/transaction-details/list/transaction-details.component'
                  ).then((c) => c.TransactionDetailsComponent),
                data: {
                  breadcrumb: { alias: 'transactions', skip: false },
                  animationState: 'isLeft',
                  reuseRoute: true,
                },
              },
              {
                path: ':id/:transactionId',
                loadComponent: () =>
                  import(
                    '../../../pages/bank/reports/transaction-details/transaction-details-view/transaction-details-view.component'
                  ).then((c) => c.TransactionDetailsViewComponent),
                data: {
                  breadcrumb: { alias: 'transactions-id', skip: false },
                  animationState: 'isRight',
                },
              },
            ],
          },
          {
            path: 'payment',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/payment-details/payment-details.component'
              ).then((p) => p.PaymentDetailsComponent),
            data: {
              breadcrumb: { alias: 'payment', skip: false },
              animationState: 'reports-module-3',
              reuseRoute: true,
            },
          },
          {
            path: 'invoice',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/invoice-details/invoice-details.component'
              ).then((m) => m.InvoiceDetailsComponent),
            data: {
              breadcrumb: { alias: 'invoice', skip: false },
              animationState: 'reports-module-4',
              reuseRoute: true,
            },
          },
          {
            path: 'cancelled',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/cancelled-invoice-report/cancelled-invoice-report.component'
              ).then((c) => c.CancelledInvoiceReportComponent),
            data: {
              breadcrumb: { alias: 'cancelled', skip: false },
              animationState: 'reports-module-5',
              reuseRoute: true,
            },
          },
          {
            path: 'amendment',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/amendment/amendment.component'
              ).then((a) => a.AmendmentComponent),
            data: {
              breadcrumb: { alias: 'amendment', skip: false },
              animationState: 'reports-module-6',
              reuseRoute: true,
            },
          },
          {
            path: 'customer',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/customer-detail-report/customer-detail-report.component'
              ).then((m) => m.CustomerDetailReportComponent),
            data: {
              breadcrumb: { alias: 'customer', skip: false },
              animationState: 'reports-module-7',
              reuseRoute: true,
            },
          },
          {
            path: 'vendors',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/vendor-detail-report/vendor-detail-report.component'
              ).then((s) => s.VendorDetailReportComponent),
            data: {
              breadcrumb: { alias: 'vendors', skip: false },
              animationState: 'reports-module-8',
            },
          },
          // {
          //   path: 'vendors/:id',
          //   loadComponent: () =>
          //     import(
          //       '../../../pages/bank/reports/vendor-detail-report/vendor-detail-report.component'
          //     ).then((s) => s.VendorDetailReportComponent),
          //   data: {
          //     breadcrumb: { alias: 'vendors', skip: false },
          //     animationState: 'reports-module-8',
          //   },
          // },
          {
            path: 'invoice-consolidated',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/consolidated-report/consolidated-report.component'
              ).then((c) => c.ConsolidatedReportComponent),
            data: {
              breadcrumb: { alias: 'invoice-consolidated', skip: false },
              animationState: 'reports-module-9',
            },
          },
          {
            path: 'payment-consolidated',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/payment-consolidated/payment-consolidated.component'
              ).then((p) => p.PaymentConsolidatedComponent),
            data: {
              breadcrumb: { alias: 'payment-consolidated', skip: false },
              animationState: 'reports-module-10',
            },
          },
          {
            path: 'userlog',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/user-log-report/user-log-report.component'
              ).then((m) => m.UserLogReportComponent),
            data: {
              breadcrumb: { alias: 'userLog', skip: false },
              animationState: 'reports-module-11',
            },
          },
          {
            path: 'audit',
            loadComponent: () =>
              import(
                '../../../pages/bank/reports/audit-trails/audit-trails.component'
              ).then((m) => m.AuditTrailsComponent),
            data: {
              breadcrumb: { alias: 'audit', skip: false },
              animationState: 'reports-module-12',
              reuseRoute: true,
            },
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
export class MainRoutingModule {}
