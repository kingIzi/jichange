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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { firstValueFrom } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { Company } from 'src/app/core/models/bank/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    NgxLoadingModule,
    SuccessMessageBoxComponent,
    TranslocoModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    MatPaginatorModule,
  ],
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class PaymentDetailsComponent implements OnInit {
  public companies: Company[] = [];
  public customers: Customer[] = [];
  public payments: any[] = [];
  public filterForm!: FormGroup;
  //public tableHeaders!: FormArray;
  public tableFormGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public headersMap = {
    DATE: 0,
    INVOICE_NUMBER: 1,
    TRANSACTION_NUMBER: 2,
    CONTROL_NUMBER: 3,
    CHANNEL: 4,
    RECEIPT_NUMBER: 5,
    AMOUNT: 6,
    BALANCE: 7,
    FROM: 8,
    TO: 9,
    FOR: 10,
  };
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
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
  private createFilterForm() {
    const currentDate = new Date();
    this.filterForm = this.fb.group({
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
    });
  }
  private async createHeaderGroup() {
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
    });
    let labels = (await firstValueFrom(
      this.tr.selectTranslate(`paymentDetails.paymentsTable`, {}, this.scope)
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
  ngOnInit(): void {
    this.createFilterForm();
    this.createHeaderGroup();
  }
  submitFilterForm() {
    if (this.filterForm.valid) {
    } else {
      this.formErrors();
    }
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.tableHeaders.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  searchTable(searchText: string) {}
  isCashAmountColumn(index: number) {
    return (
      index === this.headersMap.AMOUNT || index === this.headersMap.BALANCE
    );
  }
  get Comp() {
    return this.filterForm.get('Comp') as FormControl;
  }
  get cusid() {
    return this.filterForm.get('cusid') as FormControl;
  }
  get stdate() {
    return this.filterForm.get('stdate') as FormControl;
  }
  get enddate() {
    return this.filterForm.get('enddate') as FormControl;
  }
  get tableHeaders() {
    return this.tableFormGroup.get('tableHeaders') as FormArray;
  }
}
