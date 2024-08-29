import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-optional-confirm-message-box',
  standalone: true,
  imports: [TranslocoModule, CommonModule],
  templateUrl: './optional-confirm-message-box.component.html',
  styleUrl: './optional-confirm-message-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionalConfirmMessageBoxComponent {
  @ViewChild('optionalConfirmMessageBox')
  optionalConfirmMessageBox!: ElementRef<HTMLDialogElement>;
  constructor(private tr: TranslocoService, private cdr: ChangeDetectorRef) {}
  @Input() public title: string = '';
  @Input() public message: string = '';
  @Input() public confirmText: string = '';
  @Input() public optionConfirmText: string = '';
  @Input() public defaultChoice: EventEmitter<any> = new EventEmitter<any>();
  @Input() public optionalChoice: EventEmitter<any> = new EventEmitter<any>();

  create(allowAttachInvoice: boolean) {
    let prefix = `customer.form.actions`;
    let optionConfirmText = this.tr.translate(`${prefix}.attachInvoice`);
    let confirmConfirm = this.tr.translate(`defaults.confirm`);
    if (allowAttachInvoice) {
      this.title = this.tr.translate(`${prefix}.addCustomer`);
      this.message = this.tr.translate(`${prefix}.addCustomerMessage`);
      this.optionConfirmText = optionConfirmText;
      this.confirmText = confirmConfirm;
    } else {
      this.title = this.tr.translate(`${prefix}.addCustomer`);
      this.message = this.tr.translate(
        `${prefix}.areYouSureYouWantToAddANewCustomer`
      );
      this.optionConfirmText = '';
      this.confirmText = confirmConfirm;
    }
    this.cdr.detectChanges();
  }

  modify() {
    let prefix = `customer.form.actions`;
    let confirmConfirm = this.tr.translate(`defaults.confirm`);
    this.title = this.tr.translate(`${prefix}.modifyCustomer`);
    this.message = this.tr.translate(`${prefix}.modifyCustomerMessage`);
    this.optionConfirmText = '';
    this.confirmText = confirmConfirm;
    this.cdr.detectChanges();
  }

  openDialog() {
    let dialog = this.optionalConfirmMessageBox.nativeElement;
    dialog.showModal();
  }

  closeDialog() {
    let dialog = this.optionalConfirmMessageBox.nativeElement;
    dialog.close();
  }

  defaultChoiceClicked() {
    this.defaultChoice.emit();
    this.closeDialog();
  }

  optionalChoiceClicked() {
    this.optionalChoice.emit();
    this.closeDialog();
  }
}
