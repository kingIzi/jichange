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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { from, zip } from 'rxjs';
import { SmsTextDialogComponent } from 'src/app/components/dialogs/bank/setup/sms-text-dialog/sms-text-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { EmailTextFlow } from 'src/app/core/models/bank/setup/email-text';
import { SmsText } from 'src/app/core/models/bank/setup/sms-text';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { EmailTextService } from 'src/app/core/services/bank/setup/email-text/email-text.service';
import { SmsTextService } from 'src/app/core/services/bank/setup/sms-text/sms-text.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

@Component({
  selector: 'app-sms-text-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    MatPaginatorModule,
    RemoveItemDialogComponent,
  ],
  templateUrl: './sms-text-list.component.html',
  styleUrl: './sms-text-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
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
})
export class SmsTextListComponent implements OnInit {
  public tableFormGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  private flows: EmailTextFlow[] = [];
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private emailTextService: EmailTextService,
    private smsTextService: SmsTextService,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<SmsText>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableFormGroup() {
    this.tableFormGroup = this.fb.group({
      tableSearch: this.fb.control<string>('', []),
      headers: this.fb.array([], []),
    });
  }
  private createTableHeaders() {
    this.tr.selectTranslate('smsText.tableData', {}, this.scope).subscribe({
      next: (labels) => {
        this.appendTableHeaders(labels);
        this.tableSearchHandler();
      },
      error: (err) => {},
    });
  }
  private appendTableHeaders(labels: TableColumnsData[]) {
    let TABLE_SHOWING = 6;
    this.tableDataService.setOriginalTableColumns(labels);
    this.tableDataService.getOriginalTableColumns().forEach((column, index) => {
      let col = this.fb.group({
        included: this.fb.control(index < TABLE_SHOWING, []),
        label: this.fb.control(column.label, []),
        value: this.fb.control(column.value, []),
      });
      col.get(`included`)?.valueChanges.subscribe((included) => {
        this.tableDataService.resetTableColumns(this.headers);
      });
      this.headers.push(col);
      if (index === labels.length - 1) {
        col.disable();
      }
    });
  }
  private tableSearchHandler() {
    this.tableSearch.valueChanges.subscribe((value) => {
      this.tableDataService.searchTable(value);
    });
  }
  private parseSmsText(result: HttpDataResponse<number | SmsText[]>) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as SmsText[]);
    }
  }
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: SmsText, filter: string) => {
      let smsSubject =
        data.SMS_Subject &&
        data.SMS_Subject.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        )
          ? true
          : false;
      let smsText =
        data.SMS_Text &&
        data.SMS_Text.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
          ? true
          : false;
      return smsSubject || smsText;
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
  private assignSmsTextResponse(result: HttpDataResponse<number | SmsText[]>) {
    this.parseSmsText(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilterPredicate();
    this.dataSourceSortingAccessor();
  }
  private buildPage() {
    this.tableLoading = true;
    let flowsReq = from(this.emailTextService.getFlows());
    let listReq = from(this.smsTextService.getSmsTextList({}));
    let merged = zip(flowsReq, listReq);
    merged.subscribe({
      next: (results) => {
        let [flows, list] = results;
        this.flows = flows.response as EmailTextFlow[];
        this.assignSmsTextResponse(list);
        this.tableLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
  }
  private switchRemoveSmsTextErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(`setup.smsText.failedToFetchSmsText`);
    }
  }
  private parseRemoveSmsTextResponse(result: HttpDataResponse<number>) {
    let hasError = AppUtilities.hasErrorResult(result);
    if (hasError) {
      let errorMessage = this.switchRemoveSmsTextErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let message = this.tr.translate(
        'setup.smsText.removedSmsTextSuccessfully'
      );
      AppUtilities.showSuccessMessage(
        message,
        (e) => {},
        this.tr.translate('actions.ok')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.SNO === result.response);
      this.tableDataService.removedData(index);
    }
  }
  private removeSmsText(sno: number, userid: number) {
    this.startLoading = true;
    let removed = this.smsTextService.removeSmsText(sno, userid);
    removed.subscribe({
      next: (result) => {
        this.parseRemoveSmsTextResponse(result);
        this.startLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
  }
  ngOnInit(): void {
    this.createTableFormGroup();
    this.createTableHeaders();
    this.buildPage();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'SMS_Text':
      case 'SMS_Subject':
      case 'Mobile_Service':
      case 'Effective_Date':
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
      case 'Flow_Id':
        return `${style} font-semibold`;
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
          ?.label;
      default:
        return element[key];
    }
  }
  openSmsTextDialog() {
    let dialogRef = this.dialog.open(SmsTextDialogComponent, {
      width: '800px',
      disableClose: true,
      data: null,
    });
    dialogRef.componentInstance.addedSmsText.asObservable().subscribe({
      next: (result) => {
        dialogRef.close();
        this.tableDataService.addedData(result);
      },
    });
  }
  openSmsTextEditDialog(smsText: SmsText) {
    let dialogRef = this.dialog.open(SmsTextDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        sno: smsText.SNO,
      },
    });
    dialogRef.componentInstance.addedSmsText.asObservable().subscribe({
      next: (result) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex((item) => item.SNO === result.SNO);
        if (index > -1) {
          this.tableDataService.editedData(result, index);
        }
      },
    });
  }
  openRemoveSmsTextDialog(smsText: SmsText, dialog: RemoveItemDialogComponent) {
    let t = this.flows.find((s) => s.flow === Number(smsText.Flow_Id));
    dialog.title = this.tr.translate(`setup.smsText.removeSmsText`);
    dialog.message = this.tr
      .translate(`setup.smsText.sureRemove`)
      .replace('{}', t!?.label);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      this.removeSmsText(
        smsText.SNO,
        this.appConfig.getUserIdFromSessionStorage()
      );
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
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
  get headers() {
    return this.tableFormGroup.get('headers') as FormArray;
  }
}
