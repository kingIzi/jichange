import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
} from '@angular/core';
import { LanguageSelectorComponent } from '../../language-selector/language-selector.component';
import { Router, RouterModule } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from '../display-message-box/display-message-box.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';

@Component({
  selector: 'app-bank-user-profile',
  templateUrl: './bank-user-profile.component.html',
  styleUrls: ['./bank-user-profile.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LanguageSelectorComponent,
    RouterModule,
    DisplayMessageBoxComponent,
    TranslocoModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankUserProfileComponent {
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private appConfig: AppConfigService,
    private dialogRef: MatDialogRef<BankUserProfileComponent>,
    private router: Router,
    private client: RequestClientService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef
  ) {}
  // [routerLink]="'/auth'"
  private logout() {
    this.client
      .performPost(
        `/api/LoginUser/Logout/Userid=${this.getUserProfile().Usno}`,
        {
          Userid: this.getUserProfile().Usno,
        }
      )
      .subscribe({
        next: (result) => {
          localStorage.clear();
          this.router.navigate(['/auth']);
        },
        error: (err) => {
          AppUtilities.requestFailedCatchError(
            err,
            this.displayMessageBox,
            this.tr
          );
          this.cdr.detectChanges();
          throw err;
        },
      });
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  closeDialog() {
    this.logout();
    this.dialogRef.close();
  }
}
