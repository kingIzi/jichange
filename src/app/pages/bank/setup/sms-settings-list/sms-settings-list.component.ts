import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DisplayMessageBoxComponent } from '../../../../components/dialogs/display-message-box/display-message-box.component';
import { CommonModule } from '@angular/common';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  SmsSetting,
  SmsSettingsData,
} from 'src/app/core/models/bank/setup/sms-setting';
import { SmsSettingsService } from 'src/app/core/services/bank/setup/sms-settings/sms-settings.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { EmailTextFlow } from 'src/app/core/models/bank/setup/email-text';
import { EmailTextService } from 'src/app/core/services/bank/setup/email-text/email-text.service';
import { from, zip } from 'rxjs';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SmsSettingsDialogComponent } from 'src/app/components/dialogs/bank/setup/sms-settings-dialog/sms-settings-dialog.component';
import { AppConfigService } from 'src/app/core/services/app-config.service';

@Component({
  selector: 'app-sms-settings-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    RemoveItemDialogComponent,
  ],
  templateUrl: './sms-settings-list.component.html',
  styleUrl: './sms-settings-list.component.scss',
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
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
})
export class SmsSettingsListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public flows: EmailTextFlow[] = [];
  public tableFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private smsSettingsService: SmsSettingsService,
    private emailTextService: EmailTextService,
    private tr: TranslocoService,
    private dialog: MatDialog,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<SmsSettingsData>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableFormGroup() {
    this.tableFormGroup = this.fb.group({
      tableSearch: this.fb.control('', []),
      headers: this.fb.array([], []),
    });
  }
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 6;
    this.tr.selectTranslate('smsSettings.tableData', {}, this.scope).subscribe({
      next: (labels: TableColumnsData[]) => {
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
            this.headers.push(col);
            if (index === labels.length - 1) {
              col.disable();
            }
          });
      },
      error: (err) => {
        throw err;
      },
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
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: SmsSettingsData, filter: string) => {
      return data.USER_Name &&
        data.USER_Name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
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
  private parseSmsSettingsResponse(
    result: HttpDataResponse<number | SmsSettingsData[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as SmsSettingsData[]);
    }
  }
  private assignSmsSettingsResponse(
    result: HttpDataResponse<number | SmsSettingsData[]>
  ) {
    this.parseSmsSettingsResponse(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilterPredicate();
    this.dataSourceSortingAccessor();
  }
  private switchRemoveSmsSettingErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(`setup.smsSettings.failedToRemoveSmsSetting`);
    }
  }
  private parseRemoveSmsSettingResponse(result: HttpDataResponse<number>) {
    let hasError = AppUtilities.hasErrorResult(result);
    if (hasError) {
      let errorMessage = this.switchRemoveSmsSettingErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let message = this.tr.translate(
        'setup.smsSettings.successfullyRemovedSmsSetting'
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
  private buildPage() {
    this.tableLoading = true;
    let flowsReq = from(this.emailTextService.getFlows());
    let smsSettingsReq = from(this.smsSettingsService.getSmsSettingsList({}));
    let mergedObservable = zip(flowsReq, smsSettingsReq);
    mergedObservable.subscribe({
      next: (results) => {
        let [flows, smsSettings] = results;
        this.flows = flows.response as EmailTextFlow[];
        this.assignSmsSettingsResponse(smsSettings);
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
  private removeSmsSetting(smsId: number, userid: number) {
    this.startLoading = true;
    this.smsSettingsService.removeSmsSecurityById(smsId, userid).subscribe({
      next: (result) => {
        this.parseRemoveSmsSettingResponse(result);
        this.startLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
  }
  ngOnInit(): void {
    this.createTableFormGroup();
    this.createTableHeadersFormGroup();
    this.buildPage();
    //this.requestSmsSettings();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Effective_Date':
      case 'Local_subject':
      case 'Mobile_Service':
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
  openSmsSettingsDialog() {
    let dialogRef = this.dialog.open(SmsSettingsDialogComponent, {
      width: '800px',
      disableClose: true,
      data: null,
    });
    dialogRef.componentInstance.addedSmsSetting.asObservable().subscribe({
      next: (sms) => {
        dialogRef.close();
        this.tableDataService.addedData(sms);
      },
    });
  }
  openSmsSettingsEditDialog(smsService: SmsSettingsData) {
    let dialogRef = this.dialog.open(SmsSettingsDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        smsId: smsService.SNO,
      },
    });
    dialogRef.componentInstance.addedSmsSetting.asObservable().subscribe({
      next: (sms) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex((item) => item.SNO === sms.SNO);
        this.tableDataService.editedData(sms, index);
      },
    });
  }
  openSmsSettingsRemoveDialog(
    smsService: SmsSettingsData,
    dialog: RemoveItemDialogComponent
  ) {
    dialog.title = this.tr.translate(`setup.smsSettings.removeSmsSetting`);
    dialog.message = this.tr.translate(`setup.smsSettings.sureRemove`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      this.removeSmsSetting(
        smsService.SNO,
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
