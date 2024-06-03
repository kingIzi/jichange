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
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { UserLog } from 'src/app/core/models/bank/reports/user-log';
import { UserLogReportTable } from 'src/app/core/enums/bank/reports/user-log-report-table';
import { TimeoutError } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';

@Component({
  selector: 'app-user-log-report',
  templateUrl: './user-log-report.component.html',
  styleUrls: ['./user-log-report.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class UserLogReportComponent implements OnInit {
  public startLoading: boolean = false;
  public userReportLogs: UserLog[] = [];
  public userReportLogsData: UserLog[] = [];
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public UserLogReportTable: typeof UserLogReportTable = UserLogReportTable;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private tr: TranslocoService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableFilterFormGroup() {
    this.tableFilterFormGroup = this.fb.group({
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
    });
  }
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `userLogReport.userLogReportTable`,
      this.scope,
      this.headers,
      this.fb,
      this,
      6,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case UserLogReportTable.USERNAME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          (a?.Email ?? '').toLocaleLowerCase() >
          (b?.Email ?? '').toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case UserLogReportTable.IP_ADDRESS:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          a.Ipadd.toLocaleLowerCase() > b.Ipadd.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case UserLogReportTable.USER_GROUP:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          a.Full_Name.toLocaleLowerCase() > b.Full_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case UserLogReportTable.LOGIN_TIME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          new Date(a?.Login_Time ?? '') > new Date(b?.Login_Time ?? '') ? 1 : -1
        );
        break;
      case UserLogReportTable.LOGOUT_TIME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          new Date(a?.Logout_Time ?? '') > new Date(b?.Logout_Time ?? '')
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
      case UserLogReportTable.USERNAME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          (a?.Email ?? '').toLocaleLowerCase() <
          (b?.Email ?? '').toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case UserLogReportTable.IP_ADDRESS:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          a.Ipadd.toLocaleLowerCase() < b.Ipadd.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case UserLogReportTable.USER_GROUP:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          a.Full_Name.toLocaleLowerCase() < b.Full_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case UserLogReportTable.LOGIN_TIME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          new Date(a?.Login_Time ?? '') < new Date(b?.Login_Time ?? '') ? 1 : -1
        );
        break;
      case UserLogReportTable.LOGOUT_TIME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          new Date(a?.Logout_Time ?? '') < new Date(b?.Logout_Time ?? '')
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private formErrors(
    errorsPath: string = 'reports.userLogReport.form.errors.dialog'
  ) {
    if (this.stdate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.startDate`)
      );
    }
    if (this.enddate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.endDate`)
      );
    }
  }
  private getActiveTableKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.userLogKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let keys = this.getActiveTableKeys();
      let text = searchText.trim().toLowerCase();
      this.userReportLogs = this.userReportLogsData.filter(
        (userReportLog: any) => {
          return keys.some((key) =>
            userReportLog[key]?.toLowerCase().includes(text)
          );
        }
      );
    } else {
      this.userReportLogs = this.userReportLogsData;
    }
  }
  private requestUserLog(value: any) {
    this.tableLoading = true;
    this.reportsService
      .getUserLogTimes(value)
      .then((results: any) => {
        this.tableLoading = false;
        this.userReportLogsData =
          results.response === 0 ? [] : results.response;
        this.userReportLogs = this.userReportLogsData;
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
  ngOnInit(): void {
    this.createTableFilterFormGroup();
    this.createTableHeadersFormGroup();
  }
  private userLogKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(UserLogReportTable.USERNAME)) {
      keys.push('Email');
    }
    if (indexes.includes(UserLogReportTable.IP_ADDRESS)) {
      keys.push('Ipadd');
    }
    if (indexes.includes(UserLogReportTable.USER_GROUP)) {
      keys.push('Full_Name');
    }
    if (indexes.includes(UserLogReportTable.LOGIN_TIME)) {
      keys.push('Login_Time');
    }
    if (indexes.includes(UserLogReportTable.LOGOUT_TIME)) {
      keys.push('Logout_Time');
    }
    return keys;
  }
  submitTableFilterForm() {
    if (!this.tableFilterFormGroup.valid) {
      this.tableFilterFormGroup.markAllAsTouched();
    } else {
      let value = { ...this.tableFilterFormGroup.value };
      value.stdate = AppUtilities.reformatDate(
        this.tableFilterFormGroup.value.stdate.split('-')
      );
      value.enddate = AppUtilities.reformatDate(
        this.tableFilterFormGroup.value.enddate.split('-')
      );
      this.userReportLogsData = [];
      this.userReportLogs = this.userReportLogsData;
      this.requestUserLog(value);
    }
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  dateToFormat(date: string) {
    return new Date(date);
  }
  downloadSheet() {
    if (this.userReportLogsData.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.userReportLogsData,
        this.getActiveTableKeys(),
        'user_log_report',
        ['Login_Time', 'Logout_Time']
      );
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  get stdate() {
    return this.tableFilterFormGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.tableFilterFormGroup.get('enddate') as FormControl;
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get(`tableSearch`) as FormControl;
  }
}
