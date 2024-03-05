import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersComponent } from './customers.component';

const routes: Routes = [
  {
    path: '',
    component: CustomersComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./customers-list/customers-list.component').then(
            (c) => c.CustomersListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./customer-view/customer-view.component').then(
            (c) => c.CustomerViewComponent
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomersRoutingModule {}
