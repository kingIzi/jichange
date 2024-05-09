import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-success-message-box',
  templateUrl: './success-message-box.component.html',
  styleUrls: ['./success-message-box.component.scss'],
  standalone: true,
})
export class SuccessMessageBoxComponent implements AfterViewInit {
  @ViewChild('successMessageBox') successMessageBox!: ElementRef;
  @Input() title: string = 'Success message here';
  @Output() public closeSuccessMessageBox = new EventEmitter<any>();
  openDialog() {
    let dialog = this.successMessageBox.nativeElement as HTMLDialogElement;
    dialog.showModal();
    return dialog;
  }
  ngAfterViewInit(): void {
    // let dialog = this.successMessageBox.nativeElement as HTMLDialogElement;
    // dialog.addEventListener('close', () => {
    //   this.closeSuccessMessageBox.emit();
    // });
  }
}
