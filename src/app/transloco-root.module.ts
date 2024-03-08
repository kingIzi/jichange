import { provideTransloco, TranslocoModule } from '@ngneat/transloco';
import { NgModule } from '@angular/core';
import { TranslocoHttpLoader } from './transloco-loader';
//import { environment } from '../../Users/scott/Documents/DEV/nodejs/angular-web/jichange/src/environments/environment';
import { environment } from 'src/environments/environment';

@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['en', 'sw'],
        //defaultLang: 'en',
        defaultLang: localStorage.getItem('activeLang')
          ? localStorage.getItem('activeLang')?.toString()
          : 'en',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: environment.production,
      },
      loader: TranslocoHttpLoader,
    }),
  ],
  declarations: [],
})
export class TranslocoRootModule {}
