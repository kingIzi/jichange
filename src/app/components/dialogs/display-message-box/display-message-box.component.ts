import { Component, ElementRef, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-display-message-box',
  templateUrl: './display-message-box.component.html',
  styleUrls: ['./display-message-box.component.scss'],
  standalone: true,
})
export class DisplayMessageBoxComponent {
  @Output()
  @ViewChild('displayMessageDialog', { static: true })
  displayMessageDialog!: ElementRef<HTMLDialogElement>;
  @Input() title: string = 'Message Title';
  @Input() message: string = 'Enter error message here';

  openDialog() {
    let dialog = this.displayMessageDialog.nativeElement;
    dialog.showModal();
    return dialog;
  }
  closeDialog() {
    if (this.displayMessageDialog.nativeElement.open) {
      this.displayMessageDialog.nativeElement.close();
    }
  }
}
