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
import { AppRoutingModule } from './app/app-routing.module';
import {
  BrowserAnimationsModule,
  provideAnimations,
  provideNoopAnimations,
} from '@angular/platform-browser/animations';
import { clientInterceptor } from './app/core/interceptors/client.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom([
      AppRoutingModule,
      HttpClientModule,
      TranslocoRootModule,
    ]),
    provideAnimations(),
    provideHttpClient(withInterceptors([clientInterceptor])),
  ],
}).catch((err) => console.log(err));
