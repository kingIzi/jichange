import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { Datepicker, Input, initTE } from 'tw-elements';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { Company } from 'src/app/core/models/bank/company';
import { firstValueFrom } from 'rxjs';
import { Customer } from 'src/app/core/models/bank/customer';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { InvoiceReport } from 'src/app/core/models/bank/invoice-report';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';

@Component({
  selector: 'app-invoice-details',
  templateUrl: './invoice-details.component.html',
  styleUrls: ['./invoice-details.component.scss'],
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    LoaderRainbowComponent,
    DisplayMessageBoxComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class InvoiceDetailsComponent implements OnInit {
  public invoiceReports: InvoiceReport[] = [];
  public invoiceReportsData: InvoiceReport[] = [];
  public companies: Company[] = [];
  public customers: Customer[] = [];
  public formGroup!: FormGroup;
  public headerFormGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public headersMap = {
    INVOICE_NUMBER: 0,
    INVOICE_DATE: 1,
    CUSTOMER: 2,
    TOTAL: 3,
    WITH_VAT: 4,
    WITHOUT_VAT: 5,
  };
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private translocoService: TranslocoService,
    private dialog: MatDialog,
    private client: RequestClientService,
    private reportsService: ReportsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private fileHandler: FileHandlerService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private async preparePage() {
    this.startLoading = true;
    this.reportsService
      .getCompaniesList({})
      .then((results: any) => {
        if (typeof results.response !== 'number') {
          this.companies = results.response;
          this.startLoading = false;
        } else {
          this.companies = [];
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private createRequestFormGroup() {
    this.formGroup = this.fb.group({
      Comp: this.fb.control('', [Validators.required]),
      cusid: this.fb.control('', [Validators.required]),
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
    });
    this.companyChangedEventHandler();
  }
  private companyChangedEventHandler() {
    this.Comp.valueChanges.subscribe((value) => {
      this.startLoading = true;
      let companyList = this.reportsService.getCustomerDetailsList({
        Sno: value,
      });
      companyList
        .then((list) => {
          let data = list as HttpDataResponse<Customer[]>;
          if (typeof data.response !== 'number') {
            this.customers = data.response;
          } else {
            this.customers = [];
            this.cusid.setValue('all');
          }
          this.startLoading = false;
          this.cdr.detectChanges();
        })
        .catch((err) => {
          this.customers = [];
          this.cusid.setValue('all');
          this.cdr.detectChanges();
          throw err;
        });
    });
  }
  private async createHeaderGroup() {
    this.headerFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    let labels = (await firstValueFrom(
      this.translocoService.selectTranslate(
        `invoiceDetails.invoiceDetailsTable`,
        {},
        this.scope
      )
    )) as string[];
    labels.forEach((label, index) => {
      let header = this.fb.group({
        label: this.fb.control(label, []),
        sortAsc: this.fb.control(false, []),
        included: this.fb.control(index <= 5, []),
        values: this.fb.array([], []),
      });
      this.sortTableHeaderEventHandler(header, index);
      this.headers.push(header);
    });
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
  private sortTableAsc(ind: number) {
    switch (ind) {
      case this.headersMap.INVOICE_NUMBER:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Invoice_No.trim().toLocaleLowerCase() >
          b.Invoice_No.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.INVOICE_DATE:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          new Date(a.Invoice_Date.trim()) > new Date(b.Invoice_Date.trim())
            ? 1
            : -1
        );
        break;
      case this.headersMap.CUSTOMER:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Chus_Name.trim().toLocaleLowerCase() >
          b.Chus_Name.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.TOTAL:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Total > b.Total ? 1 : -1
        );
        break;
      case this.headersMap.WITH_VAT:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Total_Vt > b.Total_Vt ? 1 : -1
        );
        break;
      case this.headersMap.WITHOUT_VAT:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Total_Without_Vt > b.Total_Without_Vt ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case this.headersMap.INVOICE_NUMBER:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Invoice_No.trim().toLocaleLowerCase() <
          b.Invoice_No.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.INVOICE_DATE:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          new Date(a.Invoice_Date.trim()) < new Date(b.Invoice_Date.trim())
            ? 1
            : -1
        );
        break;
      case this.headersMap.CUSTOMER:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Chus_Name.trim().toLocaleLowerCase() <
          b.Chus_Name.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.TOTAL:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Total < b.Total ? 1 : -1
        );
        break;
      case this.headersMap.WITH_VAT:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Total_Vt < b.Total_Vt ? 1 : -1
        );
        break;
      case this.headersMap.WITHOUT_VAT:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Total_Without_Vt < b.Total_Without_Vt ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.Comp.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.company`)
      );
    }
    if (this.cusid.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.customer`)
      );
    }
    if (this.stdate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.startDate`)
      );
    }
    if (this.enddate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.endDate`)
      );
    }
  }
  private invoiceReportKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(this.headersMap.INVOICE_NUMBER)) {
      keys.push('Invoice_No');
    }
    if (indexes.includes(this.headersMap.CUSTOMER)) {
      keys.push('Chus_Name');
    }
    return keys;
  }
  private requestInvoiceDetails(value: any) {
    this.tableLoading = true;
    this.reportsService
      .requestInvoiceReport(value)
      .then((results: any) => {
        // this.invoiceReportsData = (
        //   results as HttpDataResponse<InvoiceReport[]>
        // ).response;
        this.invoiceReportsData =
          results.response === 0 ? [] : results.response;
        this.invoiceReports = this.invoiceReportsData;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    initTE({ Datepicker, Input });
    this.createRequestFormGroup();
    this.createHeaderGroup();
    this.preparePage();
  }
  submitForm() {
    if (this.formGroup.valid) {
      let form = { ...this.formGroup.value };
      (form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'))),
        (form.enddate = AppUtilities.reformatDate(
          this.enddate.value.split('-')
        ));
      // this.invoiceReportsData = [];
      // this.invoiceReports = this.invoiceReportsData;
      this.requestInvoiceDetails(form);
    } else {
      this.formErrors();
    }
  }
  downloadSheet() {
    let data = this.invoiceReportsData.map((d) => {
      let t = { ...d };
      t.Invoice_Date = AppUtilities.convertDotNetJsonDateToDate(
        d.Invoice_Date
      ).toLocaleDateString();
      t.Audit_Date = AppUtilities.convertDotNetJsonDateToDate(
        d.Audit_Date
      ).toLocaleDateString();
      t.approval_date = AppUtilities.convertDotNetJsonDateToDate(
        d.approval_date
      ).toLocaleDateString();
      t.p_date = AppUtilities.convertDotNetJsonDateToDate(
        d.p_date
      ).toLocaleDateString();
      t.Zreport_Date = AppUtilities.convertDotNetJsonDateToDate(
        d.Zreport_Date
      ).toLocaleDateString();
      return t;
    });
    this.fileHandler.exportAsExcelFile(data, 'invoice_report');
  }
  moneyFormat(amount: number) {
    return AppUtilities.moneyFormat(amount.toString());
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  parseDateStringFormat(date: string) {
    return new Date(date);
  }
  isCashAmountColumn(index: number) {
    return (
      index === this.headersMap.TOTAL ||
      index === this.headersMap.WITH_VAT ||
      index === this.headersMap.WITHOUT_VAT
    );
  }
  searchTable(searchText: string) {
    if (searchText) {
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
  openInvoiceDetailsGraph() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        headersMap: {},
        headers: [],
        generatedInvoices: [],
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  get Comp() {
    return this.formGroup.get('Comp') as FormControl;
  }
  get cusid() {
    return this.formGroup.get('cusid') as FormControl;
  }
  get stdate() {
    return this.formGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.formGroup.get('enddate') as FormControl;
  }
  get headers() {
    return this.headerFormGroup.get('headers') as FormArray;
  }
}
