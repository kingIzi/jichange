import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

@Component({
  selector: 'app-table-form-headers',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './table-form-headers.component.html',
  styleUrl: './table-form-headers.component.scss',
})
export class TableFormHeadersComponent {
  @Input() public formGroup!: FormGroup;
  @Input() public controlName: string = '';
  @Input() public headers!: FormArray;
  @Input() public allowAction: boolean = true;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
}
