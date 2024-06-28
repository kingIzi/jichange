import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-error-message-dialog',
  standalone: true,
  imports: [],
  templateUrl: './error-message-dialog.component.html',
  styleUrl: './error-message-dialog.component.scss',
})
export class ErrorMessageDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ErrorMessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}
}
