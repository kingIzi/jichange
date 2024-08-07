import { Injectable, OnInit } from '@angular/core';
//import { LoginResponse } from '../models/login-response';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ErrorMessageDialogComponent } from 'src/app/components/dialogs/error-message-dialog/error-message-dialog.component';
import {
  BankLoginResponse,
  VendorLoginResponse,
} from '../models/login-response';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  public userProfile!: VendorLoginResponse | BankLoginResponse;
  constructor(private dialog: MatDialog) {
    this.parseUserProfile();
  }
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as
        | VendorLoginResponse
        | BankLoginResponse;
    }
  }
  getLoginResponse() {
    this.parseUserProfile();
    return this.userProfile;
  }
  openDisabledCloseMessageDialog(title: string, message: string) {
    let dialogRef = this.dialog.open(ErrorMessageDialogComponent, {
      width: '400px',
      backdropClass: 'custom-dialog-overlay',
      disableClose: true,
      data: {
        title: title,
        message: message,
      },
    });
    return dialogRef;
  }
  getJwtTokenFromLocalStorage() {
    this.parseUserProfile();
    return this.userProfile ? this.userProfile.Token : '';
  }
  getUserIdFromLocalStorage() {
    this.parseUserProfile();
    return this.userProfile ? this.userProfile.Usno : 0;
  }
}
