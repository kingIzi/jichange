import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
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
  toArray,
  zip,
} from 'rxjs';
import { CompanyService } from 'src/app/core/services/bank/company/company.service';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Company } from 'src/app/core/models/bank/company';
import { Region } from 'src/app/core/models/bank/region';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { District } from 'src/app/core/models/bank/district';
import { Customer } from 'src/app/core/models/bank/customer';
import { VendorDetailsReportTable } from 'src/app/core/enums/bank/vendor-details-report-table';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class CustomerDetailReportComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
  public companies: Company[] = [];
  public regions: Region[] = [];
  public districts: District[] = [];
  public customers: Customer[] = [];
  public customersData: Customer[] = [];
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public headersMap = {
    CUSTOMER_NAME: VendorDetailsReportTable.CUSTOMER_NAME,
    CONTACT_PERSON: VendorDetailsReportTable.CONTACT_PERSON,
    EMAIL: VendorDetailsReportTable.EMAIL,
    ADDRESS: VendorDetailsReportTable.ADDRESS,
    DATE_POSTED: VendorDetailsReportTable.DATE_POSTED,
  };
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private tr: TranslocoService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableFilterForm() {
    this.tableFilterFormGroup = this.fb.group({
      Comp: this.fb.control('', [Validators.required]),
      reg: this.fb.control('', [Validators.required]),
      dist: this.fb.control('', [Validators.required]),
    });
    this.regionChangeEventHandler();
  }
  private async createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.tr
      .selectTranslate(
        'customerDetailReport.customerDetailReportTable',
        {},
        this.scope
      )
      .subscribe((labels: string[]) => {
        labels.forEach((label, index) => {
          let header = this.fb.group({
            label: this.fb.control(label, []),
            sortAsc: this.fb.control(false, []),
            included: this.fb.control(index < 5, []),
            values: this.fb.array([], []),
          });
          header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
            if (value === true) {
              this.sortTableAsc(index);
            } else {
              this.sortTableDesc(index);
            }
          });
          this.headers.push(header);
        });
      });
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
        this.districts =
          typeof results.response === 'number' ? [] : results.response;
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private regionChangeEventHandler() {
    this.reg.valueChanges.subscribe((value) => {
      let index = this.regions.find((r) => r.Region_SNO === Number(value));
      if (index) {
        this.fetchDistricts({ Sno: value });
      } else {
        this.districts = [];
      }
    });
  }
  private async buildPage() {
    let companiesObservable = from(this.reportsService.getCompaniesList({}));
    let regionsObservable = from(this.companyService.getRegionList());
    let mergedObservable = zip(companiesObservable, regionsObservable);
    this.startLoading = true;
    let res = lastValueFrom(
      mergedObservable.pipe(
        map((result) => {
          return result;
        }),
        catchError((err) => {
          throw err;
        })
      )
    );
    res
      .then((results: Array<any>) => {
        let [companies, regions] = results;
        this.companies = companies.response === 0 ? [] : companies.response;
        this.regions = regions.response === 0 ? [] : regions.response;
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
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
  private sortTableAsc(ind: number) {
    switch (ind) {
      case this.headersMap.CUSTOMER_NAME:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Cust_Name.toLocaleLowerCase() > b.Cust_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.CONTACT_PERSON:
        this.customers.sort((a: Customer, b: Customer) =>
          a?.ConPerson?.toLocaleLowerCase() > b?.ConPerson?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.EMAIL:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Email.toLocaleLowerCase() > b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.ADDRESS:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Address.toLocaleLowerCase() > b.Address.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.DATE_POSTED:
        this.customers.sort((a: Customer, b: Customer) =>
          new Date(a.Posted_Date) > new Date(b.Posted_Date) ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case this.headersMap.CUSTOMER_NAME:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Cust_Name.toLocaleLowerCase() < b.Cust_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.CONTACT_PERSON:
        this.customers.sort((a: Customer, b: Customer) =>
          a?.ConPerson?.toLocaleLowerCase() < b?.ConPerson?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.EMAIL:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Email.toLocaleLowerCase() < b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.ADDRESS:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Address.toLocaleLowerCase() < b.Address.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.DATE_POSTED:
        this.customers.sort((a: Customer, b: Customer) =>
          new Date(a.Posted_Date) < new Date(b.Posted_Date) ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private requestCustomerDetails(form: any) {
    //this.startLoading = true;
    this.tableLoading = true;
    this.reportsService
      .postCustomerDetailsReport(form)
      .then((results: any) => {
        //this.startLoading = false;
        this.tableLoading = false;
        this.customersData = results.response === 0 ? [] : results.response;
        this.customers = this.customersData;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        //this.startLoading = false;
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private customerKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(this.headersMap.CUSTOMER_NAME)) {
      keys.push('Cust_Name');
    }
    if (indexes.includes(this.headersMap.ADDRESS)) {
      keys.push('Address');
    }
    if (indexes.includes(this.headersMap.EMAIL)) {
      keys.push('Email');
    }
    if (indexes.includes(this.headersMap.CONTACT_PERSON)) {
      keys.push('ConPerson');
    }
    return keys;
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.buildPage();
    this.createTableFilterForm();
  }
  submitTableFilterForm() {
    if (!this.tableFilterFormGroup.valid) {
      this.formErrors();
      return;
    }
    this.customersData = [];
    this.customers = this.customersData;
    this.requestCustomerDetails(this.tableFilterFormGroup.value);
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
  searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let indexes = this.headers.controls
        .map((control, index) => {
          return control.get('included')?.value ? index : -1;
        })
        .filter((num) => num !== -1);
      let keys = this.customerKeys(indexes);
      let text = searchText.trim().toLowerCase();
      this.customers = this.customersData.filter((customer: any) => {
        return keys.some((key) => customer[key]?.toLowerCase().includes(text));
      });
    } else {
      this.customers = this.customersData;
      //this.requestCustomerDetails(this.tableFilterFormGroup.value);
    }
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
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
}
