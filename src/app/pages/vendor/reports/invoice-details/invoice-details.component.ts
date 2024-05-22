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
  Form,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { from, zip } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { InvoiceDetailsReportTable } from 'src/app/core/enums/vendor/reports/invoice-details-report-table';
import { Customer } from 'src/app/core/models/bank/customer';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { LoginResponse } from 'src/app/core/models/login-response';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    TableDateFiltersComponent,
    MatDialogModule,
    TranslocoModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-details.component.html',
  styleUrl: './invoice-details.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class InvoiceDetailsComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public userProfile!: LoginResponse;
  public tableFormGroup!: FormGroup;
  public filterFormGroup!: FormGroup;
  public invoiceReports: InvoiceReport[] = [];
  public invoiceReportsData: InvoiceReport[] = [];
  public customers: Customer[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public InvoiceDetailsReportTable: typeof InvoiceDetailsReportTable =
    InvoiceDetailsReportTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private reportService: ReportsService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private invoiceReportService: InvoiceReportServiceService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createHeaderGroup() {
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `invoiceDetails.invoiceDetailsTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private invoiceReportKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(InvoiceDetailsReportTable.INVOICE_NUMBER)) {
      keys.push('Invoice_No');
    }
    if (indexes.includes(InvoiceDetailsReportTable.CUSTOMER)) {
      keys.push('Chus_Name');
    }
    return keys;
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let indexes = this.headers.controls
        .map((control, index) => {
          return control.get('included')?.value ? index : -1;
        })
        .filter((num) => num !== -1);
      let text = searchText.trim().toLowerCase(); // Use toLowerCase() instead of toLocalLowercase()
      let keys = this.invoiceReportKeys(indexes);
      this.invoiceReports = this.invoiceReportsData.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
    } else {
      this.invoiceReports = this.invoiceReportsData;
    }
  }
  private createFilterFormGroup() {
    this.filterFormGroup = this.fb.group({
      Comp: this.fb.control(this.userProfile.InstID, []),
      cusid: this.fb.control('', [Validators.required]),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
  }
  private buildPage() {
    this.startLoading = true;
    let getInvoiceReport = from(
      this.reportService.getCustomerDetailsList({
        Sno: this.userProfile.InstID,
      })
    );
    let res = AppUtilities.pipedObservables(zip(getInvoiceReport));
    res
      .then((results) => {
        let [customers] = results;
        if (
          customers.response &&
          typeof customers.response !== 'number' &&
          typeof customers.response !== 'string'
        ) {
          this.customers = customers.response;
        }
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
  private requestInvoiceDetails(body: InvoiceReportForm) {
    this.tableLoading = true;
    this.invoiceReportService
      .getInvoiceReport(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response !== 'number' &&
          result.response !== 'string'
        ) {
          this.invoiceReportsData = result.response as InvoiceReport[];
          this.invoiceReports = this.invoiceReportsData;
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
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeaderGroup();
    this.createFilterFormGroup();
    this.buildPage();
  }
  submitFilterForm() {
    if (this.filterFormGroup.valid) {
      let form = { ...this.filterFormGroup.value };
      if (form.stdate) {
        form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
      }
      if (form.enddate) {
        form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
      }
      this.requestInvoiceDetails(form);
    } else {
      this.filterFormGroup.markAllAsTouched();
    }
  }
  get headers() {
    return this.tableFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get(`tableSearch`) as FormControl;
  }
  get Comp() {
    return this.filterFormGroup.get(`Comp`) as FormControl;
  }
  get cusid() {
    return this.filterFormGroup.get(`cusid`) as FormControl;
  }
  get stdate() {
    return this.filterFormGroup.get(`stdate`) as FormControl;
  }
  get enddate() {
    return this.filterFormGroup.get(`enddate`) as FormControl;
  }
}
