import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  NO_ERRORS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

@Component({
  selector: 'app-amendment',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
    TranslocoModule,
    LoaderInfiniteSpinnerComponent,
  ],
  templateUrl: './amendment.component.html',
  styleUrl: './amendment.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class AmendmentComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public filterFormGroup!: FormGroup;
  public tableFormGroup!: FormGroup;
  public companies: Company[] = [];
  public customers: Customer[] = [];
  public statuses: string[] = ['Paid', 'Pending', 'Cancelled'];
  public paymentTypes: string[] = ['Fixed', 'Flexible'];
  public amendments: any[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
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
      Comp: this.fb.control('', [Validators.required]),
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
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.Comp.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.company`)
      );
    }
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
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  submitFilterForm() {
    if (this.filterFormGroup.valid) {
    } else {
      this.formErrors();
    }
  }
  searchTable(searchText: string) {}
  sortColumnClicked(ind: number) {
    let sortAsc = this.tableHeaders.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  get Comp() {
    return this.filterFormGroup.get('Comp') as FormControl;
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
