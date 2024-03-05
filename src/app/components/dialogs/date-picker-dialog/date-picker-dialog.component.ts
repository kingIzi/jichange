import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-date-picker-dialog',
  templateUrl: './date-picker-dialog.component.html',
  styleUrls: ['./date-picker-dialog.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class DatePickerDialogComponent implements OnInit {
  formGroup!: FormGroup;
  @ViewChild('dialogPicker') dialogPicker!: ElementRef;
  submit = new EventEmitter<{ start: string; end: string }>();
  constructor(private fb: FormBuilder) {}
  private createForm() {
    this.formGroup = this.fb.group({
      start: this.fb.control(
        AppUtilities.dateToFormat(new Date(), 'yyyy-MM-dd'),
        [Validators.required]
      ),
      end: this.fb.control(
        AppUtilities.dateToFormat(new Date(), 'yyyy-MM-dd'),
        [Validators.required]
      ),
    });
  }
  openDialog() {
    let datePicker = this.dialogPicker.nativeElement as HTMLDialogElement;
    datePicker.showModal();
  }
  closeDialog() {
    let datePicker = this.dialogPicker.nativeElement as HTMLDialogElement;
    datePicker.close();
  }
  ngOnInit(): void {
    this.createForm();
  }
  formatDate(date: Date, format: string) {
    return AppUtilities.dateToFormat(date, format);
  }
  submitForm() {
    this.submit.emit(this.formGroup.value);
  }
  get start() {
    return this.formGroup.get('start') as FormControl;
  }
  get end() {
    return this.formGroup.get('end') as FormControl;
  }
}
