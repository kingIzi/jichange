import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-remove-item-dialog',
  templateUrl: './remove-item-dialog.component.html',
  styleUrls: ['./remove-item-dialog.component.scss'],
  standalone: true,
})
export class RemoveItemDialogComponent {
  @Output()
  @ViewChild('removeItem')
  removeItem!: ElementRef;
  @Input() title: string = 'Message Title';
  @Input() message: string = 'Enter error message here';
  public remove = new EventEmitter<any>();

  openDialog() {
    let dialog = this.removeItem.nativeElement as HTMLDialogElement;
    return dialog.showModal();
  }

  closeDialog() {
    let dialog = this.removeItem.nativeElement as HTMLDialogElement;
    dialog.close();
  }

  removeClicked() {
    this.remove.emit();
    this.closeDialog();
  }
}
