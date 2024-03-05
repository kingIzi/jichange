import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceGeneratedComponent } from './invoice-generated.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceGeneratedComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './generated-invoice-list/generated-invoice-list.component'
          ).then((c) => c.GeneratedInvoiceListComponent),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvoiceGeneratedRoutingModule {}
