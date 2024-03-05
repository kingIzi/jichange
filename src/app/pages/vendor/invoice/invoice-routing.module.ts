import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceComponent } from './invoice.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            '../../../pages/vendor/invoice/invoice-details/invoice-details.component'
          ).then((c) => c.InvoiceDetailsComponent),
      },
      {
        path: ':customerId',
        loadComponent: () =>
          import(
            '../../../pages/vendor/invoice/invoice-details/invoice-details.component'
          ).then((c) => c.InvoiceDetailsComponent),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvoiceRoutingModule {}
