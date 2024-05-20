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
import { LoginResponse } from 'src/app/core/models/login-response';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from '../display-message-box/display-message-box.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

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
  public userProfile = JSON.parse(
    localStorage.getItem('userProfile') as string
  ) as LoginResponse;
  constructor(
    private dialogRef: MatDialogRef<BankUserProfileComponent>,
    private router: Router,
    private client: RequestClientService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef
  ) {}
  // [routerLink]="'/auth'"
  private logout() {
    this.client
      .performPost(`/api/LoginUser/Logout/Userid=${this.userProfile.Usno}`, {
        Userid: this.userProfile.Usno,
      })
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
  closeDialog() {
    this.logout();
    this.dialogRef.close();
  }
}
