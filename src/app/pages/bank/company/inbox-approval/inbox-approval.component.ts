import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  NO_ERRORS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { ChangeDetectionStrategy } from '@angular/core';
import { CompanySummaryDialogComponent } from 'src/app/components/dialogs/bank/company/company-summary-dialog/company-summary-dialog.component';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
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
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { MatTooltipModule } from '@angular/material/tooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';

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
    MatTooltipModule,
    MatTableExporterModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
    {
      provide: TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class InboxApprovalComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CompanyInboxTable: typeof CompanyInboxTable = CompanyInboxTable;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('inboxApprovalTableContainer')
  inboxApprovalTableContainer!: ElementRef<HTMLDivElement>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfig: AppConfigService,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Company>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 7;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`inboxApproval.inboxApprovalTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
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
  }
  private hasCompIdQueryParamHandler() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params['compid']) {
        let compid = atob(params['compid']);
        let found = this.tableDataService
          .getData()
          .find((e) => e.CompSno === Number(compid));
        if (found) {
          this.tableSearch.setValue(found.CompName);
        }
      }
    });
  }
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: Company, filter: string) => {
      return data.CompName &&
        data.CompName.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseCompanyInboxResponse(
    result: HttpDataResponse<number | Company[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Company[]);
    }
  }
  private assignCompanyInbox(result: HttpDataResponse<number | Company[]>) {
    this.parseCompanyInboxResponse(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilterPredicate();
  }
  private requestCompanyInbox() {
    this.tableLoading = true;
    let inbox = this.approvalService.postCompanyInboxList({
      design: this.getUserProfile().desig,
      braid: Number(this.getUserProfile().braid),
    } as CompanyInboxListForm);
    inbox
      .then((result) => {
        this.assignCompanyInbox(result);
        this.hasCompIdQueryParamHandler();
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
  private parsePdf(table: HTMLTableElement, filename: string) {
    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate('company.inboxApproval.name');
    let titlePositionY = TableUtilities.writePdfTitleText(doc, titleText);
    let body = TableUtilities.pdfData(
      this.tableDataService.getData(),
      this.headers,
      []
    );
    autoTable(doc, {
      body: body,
      margin: { top: titlePositionY * 2 },
      columns: this.tableDataService
        .getTableColumns()
        .filter((e, i) => {
          return i < this.tableDataService.getTableColumns().length - 1;
        })
        .map((c, i) => {
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
    this.requestCompanyInbox();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
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
      case 'Status':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      // case 'Status':
      //   return `${style}`;
      case 'Action':
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
        return `${PerformanceUtils.getActiveStatusStyles(
          element[key],
          'Approved',
          'bg-green-100',
          'text-green-700',
          'bg-orange-100',
          'text-orange-700'
        )} text-center w-fit`;
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
      case 'AccountNo':
        return element.AccountNo
          ? element.AccountNo.slice(-4).padStart(element.AccountNo.length, 'x')
          : '-';
      default:
        return element[key];
    }
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length - 1,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'pending_approval_companies',
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
        this.inboxApprovalTableContainer.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `pending_approval_companies`);
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  approveCompany(company: Company) {
    let dialogRef = this.dialog.open(ApproveCompanyInboxComponent, {
      width: '800px',
      disableClose: true,
      data: {
        company: company,
      },
    });
    dialogRef.componentInstance.approved.asObservable().subscribe((compid) => {
      dialogRef.close();
      let msg = this.tr.translate(`company.inboxApproval.approvedSuccessfully`);
      let path = '/main/company/summary';
      let queryParams = {
        compid: btoa(compid.toString()),
        //compid: btoa((result.response as Company).CompSno.toString()),
      };
      AppUtilities.showSuccessMessage(
        msg,
        () =>
          this.router.navigate([path], {
            queryParams: queryParams,
          }),
        this.tr.translate('actions.view')
      );
      //this.requestCompanyInbox();
    });
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
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
