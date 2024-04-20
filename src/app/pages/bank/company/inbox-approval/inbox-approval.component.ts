import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  NO_ERRORS_SCHEMA,
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
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { Company } from 'src/app/core/models/bank/company';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { CompanyService } from 'src/app/core/services/bank/company/company.service';
import { CompanyInboxTableHeaders } from 'src/app/core/enums/bank/company-inbox-table-headers';
import { LoginResponse } from 'src/app/core/models/login-response';
import { ChangeDetectionStrategy } from '@angular/core';
import { CompanySummaryDialogComponent } from 'src/app/components/dialogs/bank/company/company-summary-dialog/company-summary-dialog.component';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { clientInterceptor } from 'src/app/core/interceptors/client.interceptor';
import { TimeoutError, throwError } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';

@Component({
  selector: 'app-inbox-approval',
  templateUrl: './inbox-approval.component.html',
  styleUrls: ['./inbox-approval.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    LoaderRainbowComponent,
    ReactiveFormsModule,
    MatDialogModule,
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
export class InboxApprovalComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public companies: Company[] = [];
  public companiesData: Company[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  public headersMap = {
    NAME: CompanyInboxTableHeaders.NAME,
    ADDRESS: CompanyInboxTableHeaders.ADDRESS,
    EMAIL: CompanyInboxTableHeaders.EMAIL,
    MOBILE_NUMBER: CompanyInboxTableHeaders.MOBILE_NUMBER,
    STATUS: CompanyInboxTableHeaders.STATUS,
  };
  constructor(
    private tr: TranslocoService,
    private fb: FormBuilder,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.tr
      .selectTranslate('inboxApproval.inboxApprovalTable', {}, this.scope)
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
      default:
        break;
    }
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
    if (indexes.includes(this.headersMap.MOBILE_NUMBER)) {
      keys.push('MobNo');
    }
    if (indexes.includes(this.headersMap.STATUS)) {
      keys.push('Status');
    }
    return keys;
  }
  private requestCompanyInbox() {
    this.parseUserProfile();
    this.tableLoading = true;
    let inbox = this.companyService.postCompanyInboxList({
      design: this.userProfile.desig,
      braid: Number(this.userProfile.braid),
    });
    inbox
      .then((results: any) => {
        this.companiesData = results.response === 0 ? [] : results.response;
        this.companies = this.companiesData;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
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
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.requestCompanyInbox();
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  getActiveStatusStyles(status: string) {
    return status.toLocaleLowerCase() === 'active'
      ? 'bg-green-100 text-green-600 px-4 py-1 rounded-lg shadow'
      : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow';
  }
  openEditCompanySummaryDialog(company: Company) {
    let dialogRef = this.dialog.open(CompanySummaryDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        companyData: company,
      },
    });
    this.addedCompanySuccessfully(
      this.tr.translate(`company.summary.actions.modifiedCompanySuccessfully`),
      dialogRef
    );
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  searchTable(searchText: string) {
    if (searchText) {
      let indexes = this.headers.controls
        .map((control, index) => {
          return control.get('included')?.value ? index : -1;
        })
        .filter((num) => num !== -1);
      let keys = this.companyKeys(indexes);
      let text = searchText.trim().toLowerCase();
      this.companies = this.companiesData.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
    } else {
      this.companies = this.companiesData;
    }
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
}
