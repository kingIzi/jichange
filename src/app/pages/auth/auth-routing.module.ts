import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth.component';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./sign-in/sign-in.component').then((m) => m.SignInComponent),
        data: {
          animationState: 'isLeft',
        },
      },
      {
        path: 'reset',
        loadComponent: () =>
          import('./forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
        data: {
          animationState: 'isRight',
        },
      },
      {
        path: 'otp',
        loadComponent: () =>
          import('./otp-page/otp-page.component').then(
            (o) => o.OtpPageComponent
          ),
        data: {
          animationState: 'isLeft',
        },
      },
      {
        path: 'password',
        loadComponent: () =>
          import('./change-password/change-password.component').then(
            (c) => c.ChangePasswordComponent
          ),
        data: {
          animationState: 'isRight',
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
