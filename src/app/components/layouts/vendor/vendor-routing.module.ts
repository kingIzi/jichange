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
        loadComponent: () =>
          import('../../../pages/vendor/dashboard/dashboard.component').then(
            (c) => c.DashboardComponent
          ),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('../../../pages/vendor/customers/customers.module').then(
            (m) => m.CustomersModule
          ),
      },
      {
        path: 'invoice',
        loadChildren: () =>
          import('../../../pages/vendor/invoice/invoice.module').then(
            (m) => m.InvoiceModule
          ),
      },
      {
        path: 'generated',
        loadChildren: () =>
          import(
            '../../../pages/vendor/invoice-generated/invoice-generated.module'
          ).then((m) => m.InvoiceGeneratedModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorRoutingModule {}
