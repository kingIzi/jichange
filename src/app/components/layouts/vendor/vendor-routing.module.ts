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
                '../../../pages/vendor/invoice/invoice-details/invoice-details.component'
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
                '../../../pages/vendor/invoice-generated/generated-invoice-list/generated-invoice-list.component'
              ).then((c) => c.GeneratedInvoiceListComponent),
            data: {
              breadcrumb: { alias: 'generated-invoice', skip: false },
              animationState: 'generated-invoice',
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
export class VendorRoutingModule {}
