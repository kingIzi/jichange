import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  NO_ERRORS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Company } from 'src/app/core/models/bank/company/company';
import { Ripple, initTE } from 'tw-elements';
import * as json from 'src/assets/temp/data.json';
import { CompanySummaryDialogComponent } from 'src/app/components/dialogs/bank/company/company-summary-dialog/company-summary-dialog.component';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { BreadcrumbService } from 'xng-breadcrumb';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { TimeoutError, lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { CompanySummaryTable } from 'src/app/core/enums/bank/company/company-summary-table';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    LoaderRainbowComponent,
    ReactiveFormsModule,
    SuccessMessageBoxComponent,
    DisplayMessageBoxComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
})
export class SummaryComponent implements OnInit {
  public companies: Company[] = [];
  public companiesData: Company[] = [];
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public headersFormGroup!: FormGroup;
  public includedHeaders: AbstractControl<any, any>[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CompanySummaryTable: typeof CompanySummaryTable = CompanySummaryTable;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private client: RequestClientService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private fileHandler: FileHandlerService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersFormGroup() {
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `summary.companySummary`,
      this.scope,
      this.headers,
      this.fb,
      this,
      7
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case CompanySummaryTable.NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.CompName.toLocaleLowerCase() > b.CompName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanySummaryTable.ADDRESS:
        this.companies.sort((a: Company, b: Company) =>
          a.Address.toLocaleLowerCase() > b.Address.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.EMAIL:
        this.companies.sort((a: Company, b: Company) =>
          a.Email.toLocaleLowerCase() > b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.TIN_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TinNo.toLocaleLowerCase() > b.TinNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.MOBILE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.MobNo.toLocaleLowerCase() > b.MobNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.STATUS:
        this.companies.sort((a: Company, b: Company) =>
          a?.Status?.toLocaleLowerCase() > b?.Status?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanySummaryTable.DIRECTOR_NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.DirectorName.toLocaleLowerCase() >
          b.DirectorName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanySummaryTable.POST_BOX:
        this.companies.sort((a: Company, b: Company) =>
          a.PostBox.toLocaleLowerCase() > b.PostBox.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.TELEPHONE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TelNo.toLocaleLowerCase() > b.TelNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.DATE_POSTED:
        this.companies.sort((a: Company, b: Company) =>
          a.Posteddate.toLocaleLowerCase() > b.Posteddate.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case CompanySummaryTable.NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.CompName.toLocaleLowerCase() < b.CompName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanySummaryTable.ADDRESS:
        this.companies.sort((a: Company, b: Company) =>
          a.Address.toLocaleLowerCase() < b.Address.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.EMAIL:
        this.companies.sort((a: Company, b: Company) =>
          a.Email.toLocaleLowerCase() < b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.TIN_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TinNo.toLocaleLowerCase() < b.TinNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.MOBILE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.MobNo.toLocaleLowerCase() < b.MobNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.STATUS:
        this.companies.sort((a: Company, b: Company) =>
          a?.Status?.toLocaleLowerCase() < b?.Status?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanySummaryTable.DIRECTOR_NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.DirectorName.toLocaleLowerCase() <
          b.DirectorName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanySummaryTable.POST_BOX:
        this.companies.sort((a: Company, b: Company) =>
          a.PostBox.toLocaleLowerCase() < b.PostBox.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.TELEPHONE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TelNo.toLocaleLowerCase() < b.TelNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanySummaryTable.DATE_POSTED:
        this.companies.sort((a: Company, b: Company) =>
          a.Posteddate.toLocaleLowerCase() < b.Posteddate.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private filterIncludedTableHeaders() {
    this.includedHeaders = this.headers.controls.filter(
      (control) => control.get('included')?.value
    );
  }
  private companyKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(CompanySummaryTable.NAME)) {
      keys.push('CompName');
    }
    if (indexes.includes(CompanySummaryTable.ADDRESS)) {
      keys.push('Address');
    }
    if (indexes.includes(CompanySummaryTable.EMAIL)) {
      keys.push('Email');
    }
    if (indexes.includes(CompanySummaryTable.TIN_NUMBER)) {
      keys.push('TinNo');
    }
    if (indexes.includes(CompanySummaryTable.MOBILE_NUMBER)) {
      keys.push('MobNo');
    }
    if (indexes.includes(CompanySummaryTable.STATUS)) {
      keys.push('Status');
    }
    if (indexes.includes(CompanySummaryTable.DIRECTOR_NAME)) {
      keys.push('DirectorName');
    }
    if (indexes.includes(CompanySummaryTable.POST_BOX)) {
      keys.push('PostBox');
    }
    if (indexes.includes(CompanySummaryTable.TELEPHONE_NUMBER)) {
      keys.push('TelNo');
    }
    if (indexes.includes(CompanySummaryTable.DATE_POSTED)) {
      keys.push('Posteddate');
    }
    return keys;
  }
  private requestList() {
    this.companiesData = [];
    this.companies = this.companiesData;
    this.tableLoading = true;
    this.companyService
      .getCustomersList({})
      .then((result) => {
        if (
          typeof result.response === 'number' ||
          typeof result.response === 'string'
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
        } else {
          this.companiesData = result.response;
          this.companies = this.companiesData;
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
    this.cdr.detectChanges();
  }
  private getTableActiveKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.companyKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.trim().toLowerCase();
      let keys = this.getTableActiveKeys();
      this.companies = this.companiesData.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
    } else {
      this.companies = this.companiesData;
    }
  }
  ngOnInit() {
    this.createHeadersFormGroup();
    this.requestList();
  }
  getValueArray(ind: number) {
    return this.headers.controls.at(ind)?.get('values') as FormArray;
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  openCompanySummaryDialog() {
    let dialogRef = this.dialog.open(CompanySummaryDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        companyData: null,
      },
      disableClose: true,
    });
    dialogRef.componentInstance.companyAddedSuccessfully
      .asObservable()
      .subscribe(() => {
        dialogRef.close();
        this.requestList();
      });
  }
  openEditCompanySummaryDialog(company: Company) {
    let dialogRef = this.dialog.open(CompanySummaryDialogComponent, {
      width: '800px',
      height: '600px',
      disableClose: true,
      data: {
        companyData: company,
      },
    });
    dialogRef.componentInstance.companyAddedSuccessfully
      .asObservable()
      .subscribe(() => {
        dialogRef.close();
        this.requestList();
      });
  }
  downloadSheet() {
    this.fileHandler.downloadExcelTable(
      this.companiesData,
      this.getTableActiveKeys(),
      'vendors_summary',
      ['Posteddate']
    );
  }
  get headers(): FormArray {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get('tableSearch') as FormControl;
  }
}
