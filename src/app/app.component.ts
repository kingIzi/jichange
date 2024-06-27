import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { CommonModule } from '@angular/common';
import { LoginService } from './core/services/login.service';
import { AppUtilities } from './utilities/app-utilities';
import { DisplayMessageBoxComponent } from './components/dialogs/display-message-box/display-message-box.component';
import { mainAnimations } from './components/layouts/main/router-transition-animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    TranslocoModule,
    CommonModule,
    DisplayMessageBoxComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: { scope: 'auth' } }],
  animations: [mainAnimations],
})
export class AppComponent implements OnInit {
  private idleState = 'Not started.';
  private timedOut = false;
  lastPing?: Date = undefined;
  @ViewChild('noInternetModal') noInternetModal!: ElementRef;
  @ViewChild('connectedModal') connectedModal!: ElementRef;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('sessionTimedOut') sessionTimedOut!: DisplayMessageBoxComponent;
  constructor(
    private tr: TranslocoService,
    private loginService: LoginService,
    private router: Router
  ) {}
  private verifyInternet() {
    window.addEventListener('online', () => {
      (this.connectedModal.nativeElement as HTMLDialogElement).showModal();
    });
    window.addEventListener('offline', () => {
      (this.noInternetModal.nativeElement as HTMLDialogElement).showModal();
    });
  }
  ngOnInit(): void {
    this.verifyInternet();
  }
  prepareRoute(outlet: RouterOutlet, animate: string): boolean {
    return (
      outlet && outlet.activatedRouteData && outlet.activatedRouteData[animate]
    );
  }
}
