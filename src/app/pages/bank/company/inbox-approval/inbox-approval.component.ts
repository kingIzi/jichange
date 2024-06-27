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
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { Company } from 'src/app/core/models/bank/company/company';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import { CompanyInboxTable } from 'src/app/core/enums/bank/company/company-inbox-table-headers';
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
import { Observable, TimeoutError, of, throwError } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { ApproveCompanyInboxComponent } from 'src/app/components/dialogs/bank/company/approve-company-inbox/approve-company-inbox.component';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { ApprovalService } from 'src/app/core/services/bank/company/inbox-approval/approval.service';
import { CompanyInboxListForm } from 'src/app/core/models/bank/forms/company/inbox-approval/company-inbox-list-form';
import { CompanyApprovalForm } from 'src/app/core/models/bank/forms/company/inbox-approval/company-approval-form';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';

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
    ReactiveFormsModule,
    MatDialogModule,
    SuccessMessageBoxComponent,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class InboxApprovalComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableData: {
    companies: Company[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Company>;
  } = {
    companies: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Company>([]),
  };
  public tableHeadersFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CompanyInboxTable: typeof CompanyInboxTable = CompanyInboxTable;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private tr: TranslocoService,
    private fb: FormBuilder,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private fileHandler: FileHandlerService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 6;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`inboxApproval.inboxApprovalTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
          let col = this.fb.group({
            included: this.fb.control(
              index === 0
                ? false
                : index < TABLE_SHOWING || index === labels.length - 1,
              []
            ),
            label: this.fb.control(column.label, []),
            value: this.fb.control(column.value, []),
          });
          col.get(`included`)?.valueChanges.subscribe((included) => {
            this.resetTableColumns();
          });
          if (index === labels.length - 1) {
            col.disable();
          }
          this.headers.push(col);
        });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableData.tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private companyKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(CompanyInboxTable.NAME)) {
      keys.push('CompName');
    }
    if (indexes.includes(CompanyInboxTable.ADDRESS)) {
      keys.push('Address');
    }
    if (indexes.includes(CompanyInboxTable.EMAIL)) {
      keys.push('Email');
    }
    if (indexes.includes(CompanyInboxTable.MOBILE_NUMBER)) {
      keys.push('MobNo');
    }
    if (indexes.includes(CompanyInboxTable.STATUS)) {
      keys.push('Status');
    }
    return keys;
  }
  private getTableActiveKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.companyKeys(indexes);
  }
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Company,
      filter: string
    ) => {
      return data.CompName &&
        data.CompName.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false;
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Company>(
      this.tableData.companies
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private requestCompanyInbox() {
    this.tableLoading = true;
    let inbox = this.approvalService.postCompanyInboxList({
      design: this.userProfile.desig,
      braid: Number(this.userProfile.braid),
    } as CompanyInboxListForm);
    inbox
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
          this.tableData.companies = result.response;
          this.prepareDataSource();
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeadersFormGroup();
    this.requestCompanyInbox();
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'CompName':
      case 'Email':
      case 'MobNo':
      case 'Address':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Status':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'CompName':
        return `${style} text-black font-semibold`;
      case 'Status':
        return `right-0 absolute`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.companies,
          element
        );
      default:
        return element[key];
    }
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  downloadSheet() {
    this.fileHandler.downloadExcelTable(
      this.tableData.companies,
      this.getTableActiveKeys(),
      'pending_approval_companies',
      []
    );
  }
  approveCompany(company: Company) {
    let dialogRef = this.dialog.open(ApproveCompanyInboxComponent, {
      width: '800px',
      disableClose: true,
      data: {
        company: company,
      },
    });
    dialogRef.componentInstance.approved.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestCompanyInbox();
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
