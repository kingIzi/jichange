import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { Customer } from 'src/app/core/models/vendors/customer';
import * as json from 'src/assets/temp/data.json';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoginResponse } from 'src/app/core/models/login-response';
import { from, zip, lastValueFrom, map, catchError } from 'rxjs';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { Company } from 'src/app/core/models/bank/company';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { CancelledService } from 'src/app/core/services/vendor/reports/cancelled.service';

@Component({
  selector: 'app-invoice-cancelled',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    NgxLoadingModule,
    MatDialogModule,
    RouterModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderRainbowComponent,
  ],
  templateUrl: './invoice-cancelled.component.html',
  styleUrl: './invoice-cancelled.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
})
export class InvoiceCancelledComponent implements OnInit {
  public startLoading: boolean = false;
  public invoicesList: any[] = [];
  public filterFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public companies: Company[] = [];
  public customers: { Cus_Mas_Sno: number; Customer_Name: string }[] = [];
  public invoices: GeneratedInvoice[] = [];
  public cancelledInvoices: GeneratedInvoice[] = [];
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private reportService: ReportsService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private cancelledService: CancelledService
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
  private buildPage() {
    this.startLoading = true;
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
      .then((results: Array<any>) => {
        let [companies, customers, invoices] = results;
        this.companies = companies.response === 0 ? [] : companies.response;
        this.customers = customers.response === 0 ? [] : customers.response;
        this.invoices = invoices.response === 0 ? [] : invoices.response;
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.startLoading = false;
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.cdr.detectChanges();
        throw err;
      });
  }
  private openCustomerInvoiceDialog(customer: Customer) {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
      data: {
        customer: customer,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  private formErrors(
    errorsPath = 'invoice.invoiceDetailsForm.form.errors.dialog'
  ) {
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
  private requestCancelledInvoice(value: any) {
    this.startLoading = true;
    this.cancelledService
      .getPaymentReport(value)
      .then((results: any) => {
        console.log(results);
        this.cancelledInvoices = results.response === 0 ? [] : results.response;
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.startLoading = false;
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    // let data = JSON.parse(JSON.stringify(json));
    // this.activatedRoute.params.subscribe((params) => {
    //   if (Number(params['customerId'])) {
    //     let customer = data.customers.find((elem: Customer) => {
    //       return elem.Cust_Sno === Number(params['customerId']);
    //     });
    //     this.openCustomerInvoiceDialog(customer);
    //   }
    // });
    this.parseUserProfile();
    this.createFilterForm();
    this.buildPage();
  }
  submitFilterForm() {
    if (this.filterFormGroup.valid) {
      let value = { ...this.filterFormGroup.value };
      value.stdate = AppUtilities.reformatDate(
        this.filterFormGroup.value.stdate.split('-')
      );
      value.enddate = AppUtilities.reformatDate(
        this.filterFormGroup.value.enddate.split('-')
      );
      this.requestCancelledInvoice(value);
      //this.requestPaymentReport(value);
    } else {
      this.formErrors();
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
}
