import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-cancel-generated-invoice',
  standalone: true,
  imports: [],
  templateUrl: './cancel-generated-invoice.component.html',
  styleUrl: './cancel-generated-invoice.component.scss',
})
export class CancelGeneratedInvoiceComponent {
  @Output()
  @ViewChild('removeItem')
  removeItem!: ElementRef;
  @Input() title: string = 'Message Title';
  @Input() message: string = 'Enter error message here';
  public cancelInvoice = new EventEmitter<any>();

  openDialog() {
    let dialog = this.removeItem.nativeElement as HTMLDialogElement;
    return dialog.showModal();
  }

  closeDialog() {
    let dialog = this.removeItem.nativeElement as HTMLDialogElement;
    dialog.close();
  }

  cancelInvoiceClicked() {
    this.cancelInvoice.emit();
    this.closeDialog();
  }
}
