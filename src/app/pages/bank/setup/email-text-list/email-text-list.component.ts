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
import { NgxLoadingModule } from 'ngx-loading';
import { from, Observable, of, zip } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { EmailTextDialogComponent } from 'src/app/components/dialogs/bank/setup/email-text-dialog/email-text-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { EmailTextTable } from 'src/app/core/enums/bank/setup/email-text-table';
import { RemoveEmailTextForm } from 'src/app/core/models/bank/forms/setup/email-text/remove-email-text-form';
import {
  EmailText,
  EmailTextFlow,
} from 'src/app/core/models/bank/setup/email-text';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { EmailTextService } from 'src/app/core/services/bank/setup/email-text/email-text.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-email-text-list',
  templateUrl: './email-text-list.component.html',
  styleUrls: ['./email-text-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
    LoaderInfiniteSpinnerComponent,
    RemoveItemDialogComponent,
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
export class EmailTextListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public EmailTextTable: typeof EmailTextTable = EmailTextTable;
  public flows: EmailTextFlow[] = [];
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private emailTextService: EmailTextService,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<EmailText>,
    @Inject(TRANSLOCO_SCOPE) public scope: any
  ) {}
  private createTableHeaders() {
    let TABLE_SHOWING = 6;
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`emailText.emailTextsTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
            let col = this.fb.group({
              included: this.fb.control(index < TABLE_SHOWING, []),
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
    //this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: EmailText, filter: string) => {
      return data.Subject &&
        data.Subject.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
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
  private parseEmailTextListResponse(
    result: HttpDataResponse<number | EmailText[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as EmailText[]);
    }
  }
  private assignEmailTextListResponse(
    result: HttpDataResponse<number | EmailText[]>
  ) {
    this.parseEmailTextListResponse(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilterPredicate();
    this.dataSourceSortingAccessor();
  }
  private requestEmailTextList() {
    this.tableLoading = true;
    this.emailTextService
      .getAllEmailTextList({})
      .then((result) => {
        this.assignEmailTextListResponse(result);
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
  private switchDeleteEmailTextErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(`setup.emailText.failedToDeleteEmailText`);
    }
  }
  private parseDeleteEmailTextResponse(result: HttpDataResponse<number>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchDeleteEmailTextErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let message = this.tr.translate(`setup.emailText.deletedEmailText`);
      AppUtilities.showSuccessMessage(
        message,
        (e: MouseEvent) => {},
        this.tr.translate('actions.ok')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.SNO === result.response);
      this.tableDataService.removedData(index);
    }
  }
  private requestRemoveEmailText(body: RemoveEmailTextForm) {
    this.startLoading = true;
    this.emailTextService
      .deleteEmailText(body)
      .then((result) => {
        this.parseDeleteEmailTextResponse(result);
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
  public buildPage() {
    this.startLoading = true;
    let flows = from(this.emailTextService.getFlows());
    let emails = from(this.emailTextService.getAllEmailTextList({}));
    let mergedObservable = zip(flows, emails);
    let res = AppUtilities.pipedObservables(mergedObservable);
    res
      .then((results) => {
        let [flows, emails] = results;
        this.flows = flows.response as EmailTextFlow[];
        this.assignEmailTextListResponse(emails);
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
  ngOnInit(): void {
    this.createTableHeaders();
    this.buildPage();
    //this.requestEmailTextList();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Effective_Date':
      case 'Subject':
      case 'Local_subject':
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
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Subject':
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
      case 'Effective_Date':
        return new Date(element[key]).toDateString();
      case 'Flow_Id':
        return this.flows.find((flow) => flow.flow === Number(element[key]))
          ?.label; //this.flows[element[key]];
      default:
        return element[key];
    }
  }
  openEmailTextForm() {
    let dialogRef = this.dialog.open(EmailTextDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        emailText: null,
      },
    });
    dialogRef.componentInstance.addedEmailText
      .asObservable()
      .subscribe((emailText) => {
        dialogRef.close();
        this.tableDataService.addedData(emailText);
      });
  }
  openEditEmailTextForm(emailText: EmailText) {
    let dialogRef = this.dialog.open(EmailTextDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        emailText: emailText,
      },
    });
    dialogRef.componentInstance.addedEmailText
      .asObservable()
      .subscribe((emailText) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex((item) => item.SNO === emailText.SNO);
        this.tableDataService.editedData(emailText, index);
      });
  }
  openRemoveDialog(emailText: EmailText, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.emailText.removeEmailText`);
    dialog.message = this.tr.translate(`setup.emailText.sureRemoveEmailText`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: emailText.SNO,
        userid: this.getUserProfile().Usno,
      };
      this.requestRemoveEmailText(data);
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
    return this.tableFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
