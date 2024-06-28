import { Component, EventEmitter, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-error-message-dialog',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './error-message-dialog.component.html',
  styleUrl: './error-message-dialog.component.scss',
})
export class ErrorMessageDialogComponent {
  public ok = new EventEmitter<any>();
  constructor(
    private dialogRef: MatDialogRef<ErrorMessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}
  okClicked() {
    this.ok.emit();
  }
}
