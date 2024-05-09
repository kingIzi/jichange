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
import { Company } from 'src/app/core/models/bank/company';
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
import { CompanyService } from 'src/app/core/services/bank/company/company.service';

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
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  public headersMap = {
    NAME: 0,
    ADDRESS: 1,
    EMAIL: 2,
    TIN_NUMBER: 3,
    MOBILE_NUMBER: 4,
    STATUS: 5,
    DIRECTOR_NAME: 6,
    POST_BOX: 7,
    TELEPHONE_NUMBER: 8,
    DATE_POSTED: 9,
  };
  constructor(
    private dialog: MatDialog,
    private client: RequestClientService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private fileHandler: FileHandlerService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersFormGroup() {
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.translocoService
      .selectTranslate('summary.companySummary', {}, this.scope)
      .subscribe((labels: string[]) => {
        if (labels && labels.length > 0) {
          labels.forEach((label: string, index: number) => {
            let header = this.fb.group({
              label: this.fb.control(label, []),
              sortAsc: this.fb.control(false, []),
              included: this.fb.control(index <= 5, []),
              values: this.fb.array([], []),
            });
            (header.get('included') as FormControl).valueChanges.subscribe(
              (value) => {
                this.filterIncludedTableHeaders();
              }
            );
            header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
              if (value === true) {
                this.sortTableAsc(index);
              } else {
                this.sortTableDesc(index);
              }
            });
            this.headers.push(header);
          });
          this.filterIncludedTableHeaders();
        }
      });
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case this.headersMap.NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.CompName.toLocaleLowerCase() > b.CompName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.ADDRESS:
        this.companies.sort((a: Company, b: Company) =>
          a.Address.toLocaleLowerCase() > b.Address.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.EMAIL:
        this.companies.sort((a: Company, b: Company) =>
          a.Email.toLocaleLowerCase() > b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.TIN_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TinNo.toLocaleLowerCase() > b.TinNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.MOBILE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.MobNo.toLocaleLowerCase() > b.MobNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.STATUS:
        this.companies.sort((a: Company, b: Company) =>
          a?.Status?.toLocaleLowerCase() > b?.Status?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.DIRECTOR_NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.DirectorName.toLocaleLowerCase() >
          b.DirectorName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.POST_BOX:
        this.companies.sort((a: Company, b: Company) =>
          a.PostBox.toLocaleLowerCase() > b.PostBox.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.TELEPHONE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TelNo.toLocaleLowerCase() > b.TelNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.DATE_POSTED:
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
      case this.headersMap.NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.CompName.toLocaleLowerCase() < b.CompName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.ADDRESS:
        this.companies.sort((a: Company, b: Company) =>
          a.Address.toLocaleLowerCase() < b.Address.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.EMAIL:
        this.companies.sort((a: Company, b: Company) =>
          a.Email.toLocaleLowerCase() < b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.TIN_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TinNo.toLocaleLowerCase() < b.TinNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.MOBILE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.MobNo.toLocaleLowerCase() < b.MobNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.STATUS:
        this.companies.sort((a: Company, b: Company) =>
          a?.Status?.toLocaleLowerCase() < b?.Status?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.DIRECTOR_NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.DirectorName.toLocaleLowerCase() <
          b.DirectorName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.POST_BOX:
        this.companies.sort((a: Company, b: Company) =>
          a.PostBox.toLocaleLowerCase() < b.PostBox.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.TELEPHONE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TelNo.toLocaleLowerCase() < b.TelNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.DATE_POSTED:
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
    if (indexes.includes(this.headersMap.NAME)) {
      keys.push('CompName');
    }
    if (indexes.includes(this.headersMap.ADDRESS)) {
      keys.push('Address');
    }
    if (indexes.includes(this.headersMap.EMAIL)) {
      keys.push('Email');
    }
    if (indexes.includes(this.headersMap.TIN_NUMBER)) {
      keys.push('TinNo');
    }
    if (indexes.includes(this.headersMap.MOBILE_NUMBER)) {
      keys.push('MobNo');
    }
    if (indexes.includes(this.headersMap.STATUS)) {
      keys.push('Status');
    }
    if (indexes.includes(this.headersMap.DIRECTOR_NAME)) {
      keys.push('DirectorName');
    }
    if (indexes.includes(this.headersMap.POST_BOX)) {
      keys.push('PostBox');
    }
    if (indexes.includes(this.headersMap.TELEPHONE_NUMBER)) {
      keys.push('TelNo');
    }
    return keys;
  }
  private async requestList() {
    this.companiesData = [];
    this.companies = this.companiesData;
    this.tableLoading = true;
    await this.companyService
      .getCustomersList({})
      .then((data) => {
        let customersList = data as HttpDataResponse<Company[]>;
        this.companiesData = customersList.response;
        this.companies = this.companiesData;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.tableLoading = false;
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(
            this.displayMessageBox,
            this.translocoService
          );
        } else {
          AppUtilities.noInternetError(
            this.displayMessageBox,
            this.translocoService
          );
        }
        this.cdr.detectChanges();
        throw err;
      });
    this.cdr.detectChanges();
  }
  private addedCompanySuccessfully(
    message: string,
    dialogRef: MatDialogRef<CompanySummaryDialogComponent, any>
  ) {
    dialogRef.componentInstance.companyAddedSuccessfully
      .asObservable()
      .subscribe((value) => {
        if (value) {
          this.successMessageBox.title = message;
          this.cdr.detectChanges();
          this.successMessageBox.openDialog().addEventListener('close', () => {
            dialogRef.close();
          });
        }
      });
  }

  async ngOnInit() {
    this.createHeadersFormGroup();
    await this.requestList();
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
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
      data: null,
      disableClose: true,
    });
    this.addedCompanySuccessfully(
      this.translocoService.translate(
        `company.summary.actions.addedCompanySuccessfully`
      ),
      dialogRef
    );
    dialogRef.afterClosed().subscribe(async () => {
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
    this.addedCompanySuccessfully(
      this.translocoService.translate(
        `company.summary.actions.modifiedCompanySuccessfully`
      ),
      dialogRef
    );
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  convertDateString(date: string) {
    return new Date(date).toLocaleDateString();
  }
  downloadSheet() {
    let data = this.companiesData.map((d) => {
      let t = { ...d };
      t.Posteddate = AppUtilities.convertDotNetJsonDateToDate(
        d.Posteddate
      ).toLocaleDateString();
      return t;
    });
    this.fileHandler.exportAsExcelFile(data, 'company_summary');
  }
  getActiveStatusStyles(status: string) {
    return status?.toLocaleLowerCase() === 'approved'
      ? 'bg-green-100 text-green-600 px-4 py-1 rounded-lg shadow'
      : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow';
  }
  searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let indexes = this.headers.controls
        .map((control, index) => {
          return control.get('included')?.value ? index : -1;
        })
        .filter((num) => num !== -1);
      let text = searchText.trim().toLowerCase(); // Use toLowerCase() instead of toLocalLowercase()
      let keys = this.companyKeys(indexes);
      this.companies = this.companiesData.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
    } else {
      this.companies = this.companiesData;
    }
  }
  get headers(): FormArray {
    return this.headersFormGroup.get('headers') as FormArray;
  }
}
