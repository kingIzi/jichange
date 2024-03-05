import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-success-message-box',
  templateUrl: './success-message-box.component.html',
  styleUrls: ['./success-message-box.component.scss'],
  standalone: true,
})
export class SuccessMessageBoxComponent {
  @ViewChild('successMessageBox') successMessageBox!: ElementRef;
  @Input() title: string = 'Success message here';
  openDialog() {
    let dialog = this.successMessageBox.nativeElement as HTMLDialogElement;
    dialog.showModal();
    return dialog;
  }
}
