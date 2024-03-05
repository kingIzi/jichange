import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        data: { breadcrumb: { alias: 'dashboard' } },
        loadComponent: () =>
          import('../../../pages/bank/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'company',
        loadChildren: () =>
          import('../../../pages/bank/company/company.module').then(
            (m) => m.CompanyModule
          ),
      },
      {
        path: 'setup',
        loadChildren: () =>
          import('../../../pages/bank/setup/setup.module').then(
            (m) => m.SetupModule
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('../../../pages/bank/reports/reports.module').then(
            (m) => m.ReportsModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
