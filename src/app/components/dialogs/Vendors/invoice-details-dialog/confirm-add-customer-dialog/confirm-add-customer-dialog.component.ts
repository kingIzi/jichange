import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-confirm-add-customer-dialog',
  templateUrl: './confirm-add-customer-dialog.component.html',
  styleUrls: ['./confirm-add-customer-dialog.component.scss'],
  standalone: true,
})
export class ConfirmAddCustomerDialogComponent {
  @Output()
  @ViewChild('confirmAddCustomer')
  confirmAddCustomer!: ElementRef;
  @Input() title: string = 'Message Title';
  @Input() message: string = 'Enter error message here';
  public confirm = new EventEmitter<any>();

  openDialog() {
    let dialog = this.confirmAddCustomer.nativeElement as HTMLDialogElement;
    return dialog.showModal();
  }

  closeDialog() {
    let dialog = this.confirmAddCustomer.nativeElement as HTMLDialogElement;
    dialog.close();
  }

  confirmClicked() {
    this.confirm.emit();
    this.closeDialog();
  }
}
