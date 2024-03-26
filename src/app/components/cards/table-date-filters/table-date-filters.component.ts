import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DatePickerDialogComponent } from '../../dialogs/date-picker-dialog/date-picker-dialog.component';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-table-date-filters',
  templateUrl: './table-date-filters.component.html',
  styleUrls: ['./table-date-filters.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePickerDialogComponent, TranslocoModule],
})
export class TableDateFiltersComponent {
  @Input() dropdownPosition: string = '';
  public currentIndex: number = 0;
  openDatePickerDialog(datePicker: DatePickerDialogComponent) {
    datePicker.openDialog();
    datePicker.submit.asObservable().subscribe((value) => {
      datePicker.closeDialog();
    });
  }
}
