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
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Observable, of } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { SmtpDialogComponent } from 'src/app/components/dialogs/bank/setup/smtp-dialog/smtp-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SmtpTable } from 'src/app/core/enums/bank/setup/smtp-table';
import { RemoveSmtpForm } from 'src/app/core/models/bank/forms/setup/smtp/remove-smtp';
import { SMTP } from 'src/app/core/models/bank/setup/smtp';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { SmtpService } from 'src/app/core/services/bank/setup/smtp/smtp.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-smtp-list',
  templateUrl: './smtp-list.component.html',
  styleUrls: ['./smtp-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    RemoveItemDialogComponent,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    MatTableModule,
    MatSortModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class SmtpListComponent implements OnInit {
  public userProfile!: LoginResponse;
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  // public smtps: SMTP[] = [];
  // public smtpsData: SMTP[] = [];
  public tableData: {
    smtps: SMTP[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<SMTP>;
  } = {
    smtps: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<SMTP>([]),
  };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public SmtpTable: typeof SmtpTable = SmtpTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private smtpService: SmtpService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: SMTP,
      filter: string
    ) => {
      return data.SMTP_UName &&
        data.SMTP_UName.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false ||
          (data.SMTP_Port &&
            data.SMTP_Port.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private dataSourceSortingAccessor() {
    this.tableData.dataSource.sortingDataAccessor = (
      item: any,
      property: string
    ) => {
      switch (property) {
        case 'Effective_Date':
          return new Date(item['Effective_Date']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<SMTP>(
      this.tableData.smtps
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private requestSmtpList() {
    this.tableLoading = true;
    this.smtpService
      .getAllSmtpList({})
      .then((result) => {
        // if (
        //   result.response &&
        //   typeof result.response !== 'number' &&
        //   typeof result.response !== 'string'
        // ) {
        //   this.smtpsData = result.response;
        //   this.smtps = this.smtpsData;
        // }
        // this.tableLoading = false;
        // this.cdr.detectChanges();
        if (result.response instanceof Array) {
          this.tableData.smtps = result.response;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.smtps = [];
        }
        this.prepareDataSource();
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
  private requestRemoveSmtp(body: RemoveSmtpForm) {
    this.startLoading = true;
    this.smtpService
      .deleteSmtp(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response === 'number' &&
          result.response == body.sno
        ) {
          let m = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`setup.smtp.deletedSmtp`)
          );
          this.requestSmtpList();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.smtp.failedToRemoveSmtp`)
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
  private createTableHeaders() {
    let TABLE_SHOWING = 7;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    // TableUtilities.createHeaders(
    //   this.tr,
    //   `smtp.smtpTable`,
    //   this.scope,
    //   this.headers,
    //   this.fb,
    //   this,
    //   7,
    //   true
    // );
    this.tr
      .selectTranslate(`smtp.smtpTable`, {}, this.scope)
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
  // private sortTableAsc(ind: number) {
  //   switch (ind) {
  //     case SmtpTable.FROM_ADDRESS:
  //       this.smtps.sort((a, b) =>
  //         a?.From_Address.toLocaleLowerCase() >
  //         b?.From_Address.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case SmtpTable.ADDRESS:
  //       this.smtps.sort((a, b) =>
  //         a?.SMTP_Address.toLocaleLowerCase() >
  //         b?.SMTP_Address.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case SmtpTable.USERNAME:
  //       this.smtps.sort((a, b) =>
  //         a?.SMTP_UName.toLocaleLowerCase() > b?.SMTP_UName.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case SmtpTable.CREATED:
  //       this.smtps.sort((a, b) =>
  //         new Date(a?.Effective_Date).toLocaleDateString() >
  //         new Date(b?.Effective_Date).toLocaleDateString()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     default:
  //       break;
  //   }
  // }
  // private sortTableDesc(ind: number) {
  //   switch (ind) {
  //     case SmtpTable.FROM_ADDRESS:
  //       this.smtps.sort((a, b) =>
  //         a?.From_Address.toLocaleLowerCase() <
  //         b?.From_Address.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case SmtpTable.ADDRESS:
  //       this.smtps.sort((a, b) =>
  //         a?.SMTP_Address.toLocaleLowerCase() <
  //         b?.SMTP_Address.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case SmtpTable.USERNAME:
  //       this.smtps.sort((a, b) =>
  //         a?.SMTP_UName.toLocaleLowerCase() < b?.SMTP_UName.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case SmtpTable.CREATED:
  //       this.smtps.sort((a, b) =>
  //         new Date(a?.Effective_Date).toLocaleDateString() <
  //         new Date(b?.Effective_Date).toLocaleDateString()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     default:
  //       break;
  //   }
  // }
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeaders();
    this.requestSmtpList();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'From_Address':
      case 'Effective_Date':
      case 'SMTP_Address':
      case 'SMTP_Port':
      case 'SMTP_UName':
      case 'SSL_Enable':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Action':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let SslEnable = (value: string) => {
      if (!value) return `text-black font-normal`;
      return value.toLocaleLowerCase() === 'False'.toLocaleLowerCase()
        ? `text-red-600`
        : `text-green-600`;
    };
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Name':
        return `${style} text-black font-semibold`;
      case 'SSL_Enable':
        return SslEnable(element[key]);
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(this.tableData.smtps, element);
      case 'Effective_Date':
        return new Date(element[key]).toDateString();
      default:
        return element[key];
    }
  }
  openSmtpForm() {
    let dialogRef = this.dialog.open(SmtpDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        smtp: null,
      },
    });
    dialogRef.componentInstance.addedSmtp.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestSmtpList();
    });
  }
  openEditSmtpForm(smtp: SMTP) {
    let dialogRef = this.dialog.open(SmtpDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        smtp: smtp,
      },
    });
    dialogRef.componentInstance.addedSmtp.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestSmtpList();
    });
  }
  openRemoveDialog(smtp: SMTP, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.smtp.removeSmtp`);
    dialog.message = this.tr.translate(`setup.smtp.sureRemoveSmtp`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: smtp.SNO,
        userid: this.userProfile.Usno,
      };
      this.requestRemoveSmtp(data);
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get(`tableSearch`) as FormControl;
  }
}
