import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyComponent } from './company.component';

const routes: Routes = [
  {
    path: '',
    component: CompanyComponent,
    children: [
      {
        path: '',
        redirectTo: 'summary',
        pathMatch: 'full',
      },
      {
        path: 'summary',
        loadComponent: () =>
          import('./summary/summary.component').then((c) => c.SummaryComponent),
      },
      {
        path: 'inbox',
        loadComponent: () =>
          import('./inbox-approval/inbox-approval.component').then(
            (c) => c.InboxApprovalComponent
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompanyRoutingModule {}
