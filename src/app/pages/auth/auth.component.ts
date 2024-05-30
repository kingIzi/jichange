import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { LanguageSelectorComponent } from 'src/app/components/language-selector/language-selector.component';
import { FooterComponent } from 'src/app/components/layouts/footer/footer.component';
import { fader } from 'src/app/components/layouts/main/router-transition-animations';
import { inOutAnimation } from './auth-animations';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    LanguageSelectorComponent,
    FooterComponent,
  ],
  animations: [inOutAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  prepareRoute(outlet: RouterOutlet, animate: string): boolean {
    return (
      outlet && outlet.activatedRouteData && outlet.activatedRouteData[animate]
    );
  }
}
