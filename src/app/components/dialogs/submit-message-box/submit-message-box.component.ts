import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-submit-message-box',
  templateUrl: './submit-message-box.component.html',
  styleUrls: ['./submit-message-box.component.scss'],
  standalone: true,
  imports: [TranslocoModule],
})
export class SubmitMessageBoxComponent {
  @Output()
  @ViewChild('submitMessageBox', { static: true })
  submitMessageBox!: ElementRef<HTMLDialogElement>;
  @Input() title: string = 'Message Title';
  @Input() message: string = 'Enter error message here';
  public confirm = new EventEmitter<any>();

  openDialog() {
    let dialog = this.submitMessageBox.nativeElement as HTMLDialogElement;
    dialog.showModal();
  }

  closeDialog() {
    let dialog = this.submitMessageBox.nativeElement as HTMLDialogElement;
    dialog.close();
  }

  confirmClicked() {
    this.confirm.emit();
    this.closeDialog();
  }
}
