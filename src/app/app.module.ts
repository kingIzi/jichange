import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { NgxLoadingModule } from 'ngx-loading';
import { TranslocoRootModule } from './transloco-root.module';
import { TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    HttpClientJsonpModule,
    NgxLoadingModule.forRoot({}),
    TranslocoRootModule,
    TranslocoModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
