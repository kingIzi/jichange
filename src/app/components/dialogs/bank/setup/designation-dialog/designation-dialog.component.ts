import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Designation } from 'src/app/core/models/bank/designation';

@Component({
  selector: 'app-designation-dialog',
  templateUrl: './designation-dialog.component.html',
  styleUrls: ['./designation-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class DesignationDialogComponent implements OnInit {
  public designationForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DesignationDialogComponent>,
    private translocoService: TranslocoService,
    @Inject(MAT_DIALOG_DATA) public data: { designationData: Designation }
  ) {}
  ngOnInit(): void {
    if (this.data) {
      this.createEditForm(this.data.designationData);
    } else {
      this.createForm();
    }
  }
  setDesignationValue(value: string) {
    this.designation.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitDesignationForm() {
    if (this.designationForm.valid) {
      this.isLoading.emit(this.designationForm.value);
    }
    this.designationForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'setup.designation.form.dialog') {
    if (this.designation.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingDesignation`)
      );
    }
  }
  private createForm() {
    this.designationForm = this.fb.group({
      designation: this.fb.control('', [Validators.required]),
    });
  }
  private createEditForm(designation: Designation) {
    this.designationForm = this.fb.group({
      designation: this.fb.control(designation.Desg_Name, [
        Validators.required,
      ]),
    });
  }
  get designation() {
    return this.designationForm.get('designation') as FormControl;
  }
}
