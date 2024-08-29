import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import {
  Observable,
  TimeoutError,
  catchError,
  from,
  lastValueFrom,
  map,
  of,
  toArray,
  zip,
} from 'rxjs';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Company } from 'src/app/core/models/bank/company/company';
import { Region } from 'src/app/core/models/bank/setup/region';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { District } from 'src/app/core/models/bank/setup/district';
import { Customer } from 'src/app/core/models/bank/customer';
import { VendorDetailsReportTable } from 'src/app/core/enums/bank/reports/vendor-details-report-table';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { CustomerDetailsForm } from 'src/app/core/models/bank/reports/customer-details-form';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-customer-detail-report',
  templateUrl: './customer-detail-report.component.html',
  styleUrls: ['./customer-detail-report.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    LoaderRainbowComponent,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    MatTableExporterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
    {
      provide: TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class CustomerDetailReportComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
  public filterFormData: {
    companies: Company[];
    regions: Region[];
    districts: District[];
    branches: Branch[];
  } = {
    companies: [],
    regions: [],
    districts: [],
    branches: [],
  };
  // public tableData: {
  //   customers: Customer[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<Customer>;
  // } = {
  //   customers: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<Customer>([]),
  // };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public VendorDetailsReportTable: typeof VendorDetailsReportTable =
    VendorDetailsReportTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('customerDetailReport')
  customerDetailReport!: ElementRef<HTMLDivElement>;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private companyService: CompanyService,
    private branchService: BranchService,
    private fileHandler: FileHandlerService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private tr: TranslocoService,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Customer>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableFilterForm() {
    this.tableFilterFormGroup = this.fb.group({
      Comp: this.fb.control('0', [Validators.required]),
      branch: this.fb.control(this.getUserProfile().braid, []),
      reg: this.fb.control('0', [Validators.required]),
      dist: this.fb.control('0', [Validators.required]),
    });
    if (Number(this.getUserProfile().braid) > 0) {
      this.branch.disable();
    }
    if (Number(this.getUserProfile().braid) === 0) {
      this.branchChangedEventHandler();
    }
    this.regionChangeEventHandler();
  }
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 6;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(
        `customerDetailReport.customerDetailReportTable`,
        {},
        this.scope
      )
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
            let col = this.fb.group({
              included: this.fb.control(
                index === 0 ? false : index < TABLE_SHOWING,
                []
              ),
              label: this.fb.control(column.label, []),
              value: this.fb.control(column.value, []),
            });
            col.get(`included`)?.valueChanges.subscribe((included) => {
              this.resetTableColumns();
            });
            this.headers.push(col);
          });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this.tableDataService.searchTable(value);
    });
  }
  private resetTableColumns() {
    let tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableDataService.setTableColumns(tableColumns);
    this.tableDataService.setTableColumnsObservable(tableColumns);
    //this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private fetchDistricts(body: { Sno: string }) {
    this.startLoading = true;
    this.companyService
      .getDistrictList(body)
      .then((results: any) => {
        this.startLoading = false;
        if (typeof results.response === 'number') {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.warning`),
            this.tr.translate(
              `reports.customerDetailReport.form.errors.dialog.noDistrictForRegion`
            )
          );
        }
        this.filterFormData.districts =
          typeof results.response === 'number' ? [] : results.response;
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
  private regionChangeEventHandler() {
    this.reg.valueChanges.subscribe((value) => {
      let index = this.filterFormData.regions.find(
        (r) => r.Region_SNO === Number(value)
      );
      if (index) {
        this.fetchDistricts({ Sno: value });
      } else {
        this.filterFormData.districts = [];
      }
    });
  }
  private branchChangedEventHandler() {
    this.branch.valueChanges.subscribe((value) => {
      this.requestCompaniesList({ branch: value });
    });
  }
  private requestCompaniesList(body: { branch: number | string }) {
    this.startLoading = true;
    this.reportsService
      .getBranchedCompanyList(body)
      .then((result) => {
        if (
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.filterFormData.companies = result.response;
        } else {
          this.filterFormData.companies = [];
          this.Comp.setValue('all');
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr
              .translate(`reports.customerDetailReport.noVendorsFoundInBranch`)
              .replace(
                '{}',
                this.filterFormData.branches.find(
                  (b) => b.Branch_Sno.toString() === this.branch.value
                )?.Name as string
              )
          );
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
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(
      this.reportsService.getBranchedCompanyList({
        branch: this.getUserProfile().braid,
      })
    );
    let regionsObs = from(this.companyService.getRegionList());
    let branchesObs = from(this.branchService.postBranchList({}));
    let mergedObservable = zip(companiesObs, regionsObs, branchesObs);
    let res = AppUtilities.pipedObservables(mergedObservable);
    res
      .then((results) => {
        let [companies, regions, branches] = results;
        if (
          typeof companies.response !== 'number' &&
          typeof companies.response !== 'string'
        ) {
          this.filterFormData.companies = companies.response;
        }
        if (
          typeof regions.response !== 'number' &&
          typeof regions.response !== 'string'
        ) {
          this.filterFormData.regions = regions.response;
        }
        if (
          typeof branches.response !== 'number' &&
          typeof branches.response !== 'string'
        ) {
          this.filterFormData.branches = branches.response;
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
  private formErrors(
    errorsPath: string = 'reports.customerDetailReport.form.errors.dialog'
  ) {
    if (this.Comp.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.company`)
      );
    }
    if (this.reg.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.region`)
      );
    }
    if (this.dist.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.district`)
      );
    }
  }
  private dataSourceFilter() {
    let filterPredicate = (data: Customer, filter: string) => {
      return data.Cust_Name.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Email &&
          data.Email.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private dataSourceSortingAccessor() {
    let sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'Posted_Date':
          return new Date(item['Due_Date']);
        default:
          return item[property];
      }
    };
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<Customer>(
  //     this.tableData.customers
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private parseCustomersDataList(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Customer[]);
    }
  }
  private assignCustomersDataList(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.customers = result.response;
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(
    //       `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
    //     )
    //   );
    //   this.tableData.customers = [];
    // }
    // this.prepareDataSource();
    this.parseCustomersDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private requestCustomerDetails(form: CustomerDetailsForm) {
    this.tableLoading = true;
    this.reportsService
      .postCustomerDetailsReport(form)
      .then((result) => {
        this.assignCustomersDataList(result);
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
  private customerKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(VendorDetailsReportTable.CUSTOMER_NAME)) {
      keys.push('Cust_Name');
    }
    if (indexes.includes(VendorDetailsReportTable.ADDRESS)) {
      keys.push('Address');
    }
    if (indexes.includes(VendorDetailsReportTable.EMAIL)) {
      keys.push('Email');
    }
    if (indexes.includes(VendorDetailsReportTable.PHONE)) {
      keys.push('ConPerson');
    }
    return keys;
  }
  private getActiveTableKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.customerKeys(indexes);
  }
  private initData(q: string) {
    if (q.toLocaleLowerCase() === 'Customers'.toLocaleLowerCase()) {
      this.Comp.setValue('0');
      this.reg.setValue('0');
      this.dist.setValue('0');
      this.submitTableFilterForm();
    }
  }
  private getPdfHeaderLabels() {
    let branch: string =
        this.filterFormData.branches.find((e) => {
          return e.Sno === Number(this.branch.value);
        })?.Name || this.tr.translate('defaults.any'),
      vendor: string =
        this.filterFormData.companies.find((e) => {
          return e.CompSno === Number(this.Comp.value);
        })?.CompName || this.tr.translate('defaults.any');
    return [branch, vendor];
  }
  private parsePdf(table: HTMLTableElement, filename: string) {
    let [branch, vendor] = this.getPdfHeaderLabels();
    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate(
      'reports.customerDetailReport.customerDetailReport'
    );
    let titlePositionY = TableUtilities.writePdfTitleText(doc, titleText);
    let [branchY1, branchY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      this.tr.translate('forms.branch'),
      branch,
      titlePositionY * 2
    );
    let [vendorY1, vendorY2] = TableUtilities.writePdfTextAlignedRight(
      doc,
      this.tr.translate('forms.vendor'),
      vendor,
      titlePositionY * 2
    );
    let body = TableUtilities.pdfData(
      this.tableDataService.getData(),
      this.headers,
      ['Posted_Date']
    );
    autoTable(doc, {
      body: body,
      margin: { top: vendorY2 * 1.15 },
      columns: this.tableDataService.getTableColumns().map((c) => {
        return c.label;
      }),
      headStyles: {
        fillColor: '#0B6587',
        textColor: '#ffffff',
      },
    });
    doc.save(`${filename}.pdf`);
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.buildPage();
    this.createTableFilterForm();
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params['q']) {
        let q = atob(params['q']);
        this.initData(q);
      }
    });
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Posted_Date':
      case 'Cust_Name':
      case 'Phone':
      case 'Email':
      case 'Address':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Cust_Name':
        return `${style} text-black font-semibold`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableDataService.getData(),
          element
        );
      case 'Posted_Date':
        return PerformanceUtils.convertDateStringToDate(
          element[key]
        ).toDateString();
      default:
        return element[key] ? element[key] : '-';
    }
  }
  submitTableFilterForm() {
    if (this.tableFilterFormGroup.valid) {
      let form = { ...this.tableFilterFormGroup.value };
      form.branch = this.branch.value;
      let compid = Number(this.Comp.value);
      let vendors: number[] = [];
      if (compid > 0) {
        vendors = [compid];
      } else if (compid === 0 && this.filterFormData.companies.length > 0) {
        vendors = this.filterFormData.companies.map((c) => {
          return c.CompSno;
        });
      } else {
        vendors = [];
      }

      // let reg = Number(this.reg.value);
      // let regions: number[] = [];
      // if (reg > 0) {
      //   regions = [reg];
      // } else if (reg === 0 && this.filterFormData.regions.length > 0) {
      //   regions = this.filterFormData.regions.map((r) => {
      //     return r.Region_SNO;
      //   });
      // } else {
      //   regions = [];
      // }

      // let dist = Number(this.reg.value);
      // let districts: number[] = [];
      // if (dist > 0) {
      //   districts = [dist];
      // } else if (dist === 0 && this.filterFormData.districts.length > 0) {
      //   districts = this.filterFormData.districts.map((r) => {
      //     return r.SNO;
      //   });
      // } else {
      //   districts = [];
      // }

      let body = {
        vendors: vendors,
      } as CustomerDetailsForm;

      this.requestCustomerDetails(body);
    } else {
      this.tableFilterFormGroup.markAllAsTouched();
    }
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  dateToFormat(date: string) {
    return new Date(date);
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'customer_detail_report',
        Props: {
          Author: 'Biz logic solutions',
        },
      });
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  downloadPdf() {
    if (this.tableDataService.getData().length > 0) {
      let table =
        this.customerDetailReport.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `customer_detail_report`);
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  getTableDataSource() {
    return this.tableDataService.getDataSource();
  }
  getTableDataList() {
    return this.tableDataService.getData();
  }
  getTableDataColumns() {
    return this.tableDataService.getTableColumns();
  }
  geTableDataColumnsObservable() {
    return this.tableDataService.getTableColumnsObservable();
  }
  get Comp() {
    return this.tableFilterFormGroup.get('Comp') as FormControl;
  }
  get reg() {
    return this.tableFilterFormGroup.get('reg') as FormControl;
  }
  get dist() {
    return this.tableFilterFormGroup.get('dist') as FormControl;
  }
  get branch() {
    return this.tableFilterFormGroup.get('branch') as FormControl;
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
