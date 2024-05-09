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
import { UserLog } from 'src/app/core/models/bank/user-log';
import { UserLogReportTable } from 'src/app/core/enums/bank/user-log-report-table';
import { TimeoutError } from 'rxjs';

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
  public headersMap = {
    USERNAME: UserLogReportTable.USERNAME,
    IP_ADDRESS: UserLogReportTable.IP_ADDRESS,
    USER_GROUP: UserLogReportTable.USER_GROUP,
    LOGIN_TIME: UserLogReportTable.LOGIN_TIME,
    LOGOUT_TIME: UserLogReportTable.LOGOUT_TIME,
  };
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private tr: TranslocoService,
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
    });
    this.tr
      .selectTranslate('userLogReport.userLogReportTable', {}, this.scope)
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
      case this.headersMap.USERNAME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          (a?.Email ?? '').toLocaleLowerCase() >
          (b?.Email ?? '').toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.IP_ADDRESS:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          a.Ipadd.toLocaleLowerCase() > b.Ipadd.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.USER_GROUP:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          a.Full_Name.toLocaleLowerCase() > b.Full_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.LOGIN_TIME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          new Date(a?.Login_Time ?? '') > new Date(b?.Login_Time ?? '') ? 1 : -1
        );
        break;
      case this.headersMap.LOGOUT_TIME:
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
      case this.headersMap.USERNAME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          (a?.Email ?? '').toLocaleLowerCase() <
          (b?.Email ?? '').toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.IP_ADDRESS:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          a.Ipadd.toLocaleLowerCase() < b.Ipadd.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.USER_GROUP:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          a.Full_Name.toLocaleLowerCase() < b.Full_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.LOGIN_TIME:
        this.userReportLogs.sort((a: UserLog, b: UserLog) =>
          new Date(a?.Login_Time ?? '') < new Date(b?.Login_Time ?? '') ? 1 : -1
        );
        break;
      case this.headersMap.LOGOUT_TIME:
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
        this.tableLoading = false;
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
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
    if (indexes.includes(this.headersMap.USERNAME)) {
      keys.push('Email');
    }
    if (indexes.includes(this.headersMap.IP_ADDRESS)) {
      keys.push('Ipadd');
    }
    if (indexes.includes(this.headersMap.USER_GROUP)) {
      keys.push('Full_Name');
    }
    if (indexes.includes(this.headersMap.LOGIN_TIME)) {
      keys.push('Login_Time');
    }
    if (indexes.includes(this.headersMap.LOGOUT_TIME)) {
      keys.push('Logout_Time');
    }
    return keys;
  }
  submitTableFilterForm() {
    if (!this.tableFilterFormGroup.valid) {
      this.formErrors();
      return;
    }
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
  searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let indexes = this.headers.controls
        .map((control, index) => {
          return control.get('included')?.value ? index : -1;
        })
        .filter((num) => num !== -1);
      let keys = this.userLogKeys(indexes);
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
  get stdate() {
    return this.tableFilterFormGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.tableFilterFormGroup.get('enddate') as FormControl;
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
}
