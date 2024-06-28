import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { TranslocoRootModule } from './app/transloco-root.module';
import {
  HttpClientModule,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { AppRoutingModule, routes } from './app/app-routing.module';
import {
  BrowserAnimationsModule,
  provideAnimations,
  provideNoopAnimations,
} from '@angular/platform-browser/animations';
import {
  authInterceptor,
  timeoutInterceptor,
} from './app/core/interceptors/client.interceptor';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive';
import { AppConfigService } from './app/core/services/app-config.service';
import { MatDialogModule } from '@angular/material/dialog';
import { provideRouter, withViewTransitions } from '@angular/router';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom([
      AppRoutingModule,
      HttpClientModule,
      TranslocoRootModule,
      MatDialogModule,
      NgIdleKeepaliveModule.forRoot(),
    ]),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor, timeoutInterceptor])),
    provideRouter(routes, withViewTransitions()),
    AppConfigService,
  ],
}).catch((err) => console.log(err));
