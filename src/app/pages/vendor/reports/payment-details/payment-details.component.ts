import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
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
import {
  catchError,
  firstValueFrom,
  from,
  lastValueFrom,
  map,
  zip,
} from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { Company } from 'src/app/core/models/bank/company/company';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CustomerName } from 'src/app/core/models/vendors/customer-name';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    MatPaginatorModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    TranslocoModule,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class PaymentDetailsComponent implements OnInit {
  public tableFormGroup!: FormGroup;
  public filterFormGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public companies: Company[] = [];
  public customers: CustomerName[] = [];
  public invoices: GeneratedInvoice[] = [];
  public payments: any[] = [];
  public userProfile!: LoginResponse;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private invoiceService: InvoiceService,
    private reportService: ReportsService,
    private paymentService: PaymentsService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createFilterForm() {
    this.filterFormGroup = this.fb.group({
      compid: this.fb.control(this.userProfile.InstID, [Validators.required]),
      cust: this.fb.control('', [Validators.required]),
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
      invno: this.fb.control('', [Validators.required]),
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
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.cust.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.customer`)
      );
    }
    if (this.invno.valid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.invoiceNo`)
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
  private buildPage() {
    this.tableLoading = true;
    let companiesObservable = from(this.reportService.getCompaniesList({}));
    let customersObservable = from(
      this.invoiceService.getInvoiceCustomerNames({
        compid: this.userProfile.InstID,
      })
    );
    let invoicesObservable = from(
      this.invoiceService.postSignedDetails({ compid: this.userProfile.InstID })
    );
    let mergedObservable = zip(
      companiesObservable,
      customersObservable,
      invoicesObservable
    );
    lastValueFrom(
      mergedObservable.pipe(
        map((result) => {
          return result;
        }),
        catchError((err) => {
          throw err;
        })
      )
    )
      .then((results) => {
        let [companies, customers, invoices] = results;
        if (
          companies.response &&
          typeof companies.response !== 'string' &&
          typeof companies.response !== 'number'
        ) {
          this.companies = companies.response;
        }
        if (
          customers.response &&
          typeof customers.response !== 'string' &&
          typeof customers.response !== 'number'
        ) {
          this.customers = customers.response;
        }
        if (
          invoices.response &&
          typeof invoices.response !== 'string' &&
          typeof invoices.response !== 'number'
        ) {
          this.invoices = invoices.response;
        }
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private requestPaymentReport(value: any) {
    this.startLoading = true;
    this.paymentService
      .getPaymentReport(value)
      .then((results: any) => {
        this.payments = results.response === 0 ? [] : results.response;
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private reformatDate(values: string[]) {
    let [year, month, date] = values;
    return `${month}/${date}/${year}`;
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createFilterForm();
    this.createHeaderGroup();
    this.buildPage();
  }
  searchTable(searchText: string) {}
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.tableHeaders.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  submitFilterForm() {
    if (this.filterFormGroup.valid) {
      let value = { ...this.filterFormGroup.value };
      value.stdate = this.reformatDate(
        this.filterFormGroup.value.stdate.split('-')
      );
      value.enddate = this.reformatDate(
        this.filterFormGroup.value.enddate.split('-')
      );
      this.requestPaymentReport(value);
    } else {
      this.filterFormGroup.markAllAsTouched();
      //this.formErrors();
    }
  }
  get compid() {
    return this.filterFormGroup.get('compid') as FormControl;
  }
  get cust() {
    return this.filterFormGroup.get('cust') as FormControl;
  }
  get stdate() {
    return this.filterFormGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.filterFormGroup.get('enddate') as FormControl;
  }
  get invno() {
    return this.filterFormGroup.get('invno') as FormControl;
  }
  get tableHeaders() {
    return this.tableFormGroup.get('tableHeaders') as FormArray;
  }
}
