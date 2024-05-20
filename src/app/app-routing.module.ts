import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { loggedInGuard } from './core/guards/logged-in.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'main',
    data: { breadcrumb: { alias: 'home', skip: false } },
    loadChildren: () =>
      import('./components/layouts/main/main.module').then((m) => m.MainModule),
    canActivate: [loggedInGuard],
  },
  {
    path: 'vendor',
    data: { breadcrumb: { alias: 'vendor', skip: false } },
    loadChildren: () =>
      import('./components/layouts/vendor/vendor.module').then(
        (m) => m.VendorModule
      ),
    canActivate: [loggedInGuard],
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
