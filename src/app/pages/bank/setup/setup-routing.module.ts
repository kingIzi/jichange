import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SetupComponent } from './setup.component';

const routes: Routes = [
  {
    path: '',
    component: SetupComponent,
    children: [
      {
        path: '',
        redirectTo: 'country',
        pathMatch: 'full',
      },
      {
        path: 'country',
        loadComponent: () =>
          import('./country-list/country-list.component').then(
            (m) => m.CountryListComponent
          ),
      },
      {
        path: 'region',
        loadComponent: () =>
          import('./region-list/region-list.component').then(
            (m) => m.RegionListComponent
          ),
      },
      {
        path: 'district',
        loadComponent: () =>
          import('./district-list/district-list.component').then(
            (m) => m.DistrictListComponent
          ),
      },
      {
        path: 'ward',
        loadComponent: () =>
          import('./ward-list/ward-list.component').then(
            (m) => m.WardListComponent
          ),
      },
      {
        path: 'currency',
        loadComponent: () =>
          import('./currency-list/currency-list.component').then(
            (m) => m.CurrencyListComponent
          ),
      },
      {
        path: 'designation',
        loadComponent: () =>
          import('./designation-list/designation-list.component').then(
            (m) => m.DesignationListComponent
          ),
      },
      {
        path: 'branch',
        loadComponent: () =>
          import('./branch-list/branch-list.component').then(
            (m) => m.BranchListComponent
          ),
      },
      {
        path: 'question',
        loadComponent: () =>
          import('./question-name-list/question-name-list.component').then(
            (m) => m.QuestionNameListComponent
          ),
      },
      {
        path: 'smtp',
        loadComponent: () =>
          import('./smtp-list/smtp-list.component').then(
            (m) => m.SmtpListComponent
          ),
      },
      {
        path: 'email',
        loadComponent: () =>
          import('./email-text-list/email-text-list.component').then(
            (m) => m.EmailTextListComponent
          ),
      },
      {
        path: 'user',
        loadComponent: () =>
          import('./bank-user-list/bank-user-list.component').then(
            (m) => m.BankUserListComponent
          ),
      },
      {
        path: 'language',
        loadComponent: () =>
          import('./language-setup/language-setup.component').then(
            (c) => c.LanguageSetupComponent
          ),
      },
      {
        path: 'suspense',
        loadComponent: () =>
          import(
            './suspense-account-list/suspense-account-list.component'
          ).then((c) => c.SuspenseAccountListComponent),
      },
      {
        path: 'deposit',
        loadComponent: () =>
          import('./deposit-account-list/deposit-account-list.component').then(
            (c) => c.DepositAccountListComponent
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetupRoutingModule {}
