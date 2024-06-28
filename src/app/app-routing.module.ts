import { NgModule } from '@angular/core';
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router';
import { loggedInGuard } from './core/guards/logged-in.guard';
import { DefaultRouteReuseStrategy } from './utilities/default-route-reuse-strategy';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.module').then((m) => m.AuthModule),
    data: {
      animationState: 'auth-module',
    },
  },
  {
    path: 'main',
    data: {
      breadcrumb: { alias: 'home', skip: false },
      animationState: 'main-module',
    },
    loadChildren: () =>
      import('./components/layouts/main/main.module').then((m) => m.MainModule),
    canActivate: [loggedInGuard],
  },
  {
    path: 'vendor',
    data: {
      breadcrumb: { alias: 'vendor', skip: false },
      animationState: 'vendor-module',
    },
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
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: DefaultRouteReuseStrategy,
    },
  ],
})
export class AppRoutingModule {}
