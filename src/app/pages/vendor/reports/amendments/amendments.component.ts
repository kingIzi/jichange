import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { Customer } from 'src/app/core/models/bank/customer';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-amendments',
  standalone: true,
  imports: [
    MatPaginatorModule,
    CommonModule,
    TranslocoModule,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './amendments.component.html',
  styleUrl: './amendments.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class AmendmentsComponent implements OnInit {
  public tableLoading: boolean = false;
  public filterFormGroup!: FormGroup;
  public tableFormGroup!: FormGroup;
  public amendments: any[] = [];
  public customers: Customer[] = [];
  public statuses: string[] = ['Paid', 'Pending', 'Cancelled'];
  public paymentTypes: string[] = ['Fixed', 'Flexible'];
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private tr: TranslocoService,
    private fb: FormBuilder,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createFilterForm() {
    const currentDate = new Date();
    this.filterFormGroup = this.fb.group({
      cusid: this.fb.control('', [Validators.required]),
      stdate: this.fb.control(
        AppUtilities.dateToFormat(
          new Date(
            currentDate.getFullYear() - 4,
            currentDate.getMonth(),
            currentDate.getDate()
          ),
          'yyyy-MM-dd'
        ),
        [Validators.required]
      ),
      enddate: this.fb.control(
        AppUtilities.dateToFormat(currentDate, 'yyyy-MM-dd'),
        [Validators.required]
      ),
      status: this.fb.control('', []),
      paymentType: this.fb.control('', []),
    });
  }
  private async createHeaderGroup() {
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
    });
    let labels = (await firstValueFrom(
      this.tr.selectTranslate(`amendmentDetails.amendmentTable`, {}, this.scope)
    )) as string[];
    labels.forEach((label, index) => {
      let header = this.fb.group({
        label: this.fb.control(label, []),
        sortAsc: this.fb.control(false, []),
        included: this.fb.control(index <= 5, []),
        values: this.fb.array([], []),
      });
      this.sortTableHeaderEventHandler(header, index);
      this.tableHeaders.push(header);
    });
  }
  private sortTableAsc(ind: number) {
    throw Error('unimplemented method');
  }
  private sortTableDesc(ind: number) {
    throw Error('unimplemented method');
  }
  private sortTableHeaderEventHandler(header: FormGroup, index: number) {
    header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
      if (value === true) {
        this.sortTableAsc(index);
      } else {
        this.sortTableDesc(index);
      }
    });
  }
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.cusid.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.customer`)
      );
    }
    if (this.stdate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.startDate`)
      );
    }
    if (this.enddate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.endDate`)
      );
    }
  }
  ngOnInit(): void {
    this.createFilterForm();
    this.createHeaderGroup();
  }
  submitFilterForm() {
    if (this.filterFormGroup.valid) {
    } else {
      this.formErrors();
    }
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  searchTable(searchtext: string) {}
  sortColumnClicked(ind: number) {
    let sortAsc = this.tableHeaders.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  get cusid() {
    return this.filterFormGroup.get('cusid') as FormControl;
  }
  get stdate() {
    return this.filterFormGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.filterFormGroup.get('enddate') as FormControl;
  }
  get status() {
    return this.filterFormGroup.get('status') as FormControl;
  }
  get paymentType() {
    return this.filterFormGroup.get('paymentType') as FormControl;
  }
  get tableHeaders() {
    return this.tableFormGroup.get('tableHeaders') as FormArray;
  }
}
