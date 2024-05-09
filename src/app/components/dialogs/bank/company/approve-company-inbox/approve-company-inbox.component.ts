import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  NO_ERRORS_SCHEMA,
  Output,
  ViewChild,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-approve-company-inbox',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './approve-company-inbox.component.html',
  styleUrl: './approve-company-inbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ApproveCompanyInboxComponent {
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  @Output() public approve = new EventEmitter<any>();
  @Output() public close = new EventEmitter<any>();
  openDialog() {
    this.dialog.nativeElement.showModal();
    return this.dialog.nativeElement;
  }
  closeDialog() {
    this.close.emit();
  }
  approveCompany() {
    this.approve.emit();
  }
}
