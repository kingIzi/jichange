import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-cancelled-dialog',
  templateUrl: './cancelled-dialog.component.html',
  styleUrls: ['./cancelled-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class CancelledDialogComponent {
  public cancelledText: number[] = Array.from(
    { length: 3 },
    (_, index) => index
  );
  public cancelledContainer: number[] = Array.from(
    { length: 12 },
    (_, index) => index
  );
}
