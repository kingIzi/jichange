import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-submit-message-box',
  templateUrl: './submit-message-box.component.html',
  styleUrls: ['./submit-message-box.component.scss'],
  standalone: true,
})
export class SubmitMessageBoxComponent {
  @Output()
  @ViewChild('submitMessageBox')
  submitMessageBox!: ElementRef;
  @Input() title: string = 'Message Title';
  @Input() message: string = 'Enter error message here';
  public attachInvoice = new EventEmitter<any>();
  public addCustomer = new EventEmitter<any>();

  openDialog() {
    let dialog = this.submitMessageBox.nativeElement as HTMLDialogElement;
    return dialog.showModal();
  }

  closeDialog() {
    let dialog = this.submitMessageBox.nativeElement as HTMLDialogElement;
    dialog.close();
  }

  addCustomerClikced() {
    this.addCustomer.emit();
    this.closeDialog();
  }

  attachInvoiceClicked() {
    this.attachInvoice.emit();
    this.closeDialog();
  }
}
