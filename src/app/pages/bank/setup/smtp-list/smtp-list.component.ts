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
import { MatTooltipModule } from '@angular/material/tooltip';
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
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { SmtpTable } from 'src/app/core/enums/bank/setup/smtp-table';
import { RemoveSmtpForm } from 'src/app/core/models/bank/forms/setup/smtp/remove-smtp';
import { SMTP } from 'src/app/core/models/bank/setup/smtp';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { SmtpService } from 'src/app/core/services/bank/setup/smtp/smtp.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
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
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
    {
      provide: TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class SmtpListComponent implements OnInit {
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public SmtpTable: typeof SmtpTable = SmtpTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private smtpService: SmtpService,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<SMTP>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: SMTP, filter: string) => {
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
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private dataSourceSortingAccessor() {
    let sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'Effective_Date':
          return new Date(item['Effective_Date']);
        default:
          return item[property];
      }
    };
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  private parseSmtpListResponse(result: HttpDataResponse<number | SMTP[]>) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as SMTP[]);
    }
  }
  private requestSmtpList() {
    this.tableLoading = true;
    this.smtpService
      .getAllSmtpList({})
      .then((result) => {
        this.parseSmtpListResponse(result);
        this.tableDataService.prepareDataSource(this.paginator, this.sort);
        this.dataSourceFilterPredicate();
        this.dataSourceSortingAccessor();
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
  private switchDeleteSmtpErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(`setup.smtp.failedToRemoveSmtp`);
    }
  }
  private parseDeleteSmtpResponse(result: HttpDataResponse<number>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchDeleteSmtpErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let successMessage = this.tr.translate(`setup.smtp.deletedSmtp`);
      AppUtilities.showSuccessMessage(
        successMessage,
        (e: MouseEvent) => {},
        this.tr.translate('actions.ok')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.SNO === result.response);
      this.tableDataService.removedData(index);
    }
  }
  private requestRemoveSmtp(body: RemoveSmtpForm) {
    this.startLoading = true;
    this.smtpService
      .deleteSmtp(body)
      .then((result) => {
        this.parseDeleteSmtpResponse(result);
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
    this.tr
      .selectTranslate(`smtp.smtpTable`, {}, this.scope)
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
  ngOnInit(): void {
    this.createTableHeaders();
    this.requestSmtpList();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
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
      case 'From_Address':
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
        return PerformanceUtils.getIndexOfItem(
          this.tableDataService.getData(),
          element
        );
      case 'Effective_Date':
        return new Date(element[key]).toDateString();
      default:
        return element[key];
    }
  }
  openSmtpForm() {
    let dialogRef = this.dialog.open(SmtpDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        smtp: null,
      },
    });
    dialogRef.componentInstance.addedSmtp.asObservable().subscribe((smtp) => {
      dialogRef.close();
      this.tableDataService.addedData(smtp);
    });
  }
  openEditSmtpForm(smtp: SMTP) {
    let dialogRef = this.dialog.open(SmtpDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        smtp: smtp,
      },
    });
    dialogRef.componentInstance.addedSmtp.asObservable().subscribe((smtp) => {
      dialogRef.close();
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.SNO === smtp.SNO);
      this.tableDataService.editedData(smtp, index);
    });
  }
  openRemoveDialog(smtp: SMTP, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.smtp.removeSmtp`);
    dialog.message = this.tr.translate(`setup.smtp.sureRemoveSmtp`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: smtp.SNO,
        userid: this.getUserProfile().Usno,
      };
      this.requestRemoveSmtp(data);
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
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get(`tableSearch`) as FormControl;
  }
}
