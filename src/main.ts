import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { TranslocoRootModule } from './app/transloco-root.module';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app/app-routing.module';
import {
  BrowserAnimationsModule,
  provideAnimations,
  provideNoopAnimations,
} from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    // importProvidersFrom(TranslocoRootModule),
    // importProvidersFrom(HttpClientModule),
    // importProvidersFrom(AppRoutingModule),
    importProvidersFrom([
      AppRoutingModule,
      HttpClientModule,
      TranslocoRootModule,
    ]),
    provideAnimations(),
  ],
}).catch((err) => console.log(err));
