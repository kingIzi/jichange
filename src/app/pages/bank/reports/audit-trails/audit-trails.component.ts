import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
  Validators,
} from '@angular/forms';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { TablePaginationComponent } from 'src/app/components/table-pagination/table-pagination.component';
import { AuditTrail } from 'src/app/core/models/bank/reports/auditTrail';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { formatDate } from '@angular/common';
import { DateFormatDirective } from 'src/app/utilities/date-format.directive';
import { AuditTrailsService } from 'src/app/core/services/bank/reports/audit-trails/audit-trails.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TimeoutError, from, zip } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { AuditTrailsTable } from 'src/app/core/enums/bank/reports/audit-trails-table';
import { AuditTrailsReportForm } from 'src/app/core/models/bank/forms/reports/audit-trails-report-form';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { LoginResponse } from 'src/app/core/models/login-response';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';

@Component({
  selector: 'app-audit-trails',
  templateUrl: './audit-trails.component.html',
  styleUrls: ['./audit-trails.component.scss'],
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    TableDateFiltersComponent,
    ReactiveFormsModule,
    LoaderRainbowComponent,
    DisplayMessageBoxComponent,
    TablePaginationComponent,
    MatPaginatorModule,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditTrailsComponent implements OnInit {
  public selectPageOptions: string[] = [
    'Country',
    'Region',
    'District',
    'Ward',
    'Designation',
    'Currency',
    'Email Text',
    'Smtp Settings',
    'Bank User',
    'Questions',
    'Vat Percentage',
    'Company',
  ];
  public actions: string[] = ['All', 'Insert', 'Update', 'Delete'];
  public formGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public branches: Branch[] = [];
  public auditTrails: AuditTrail[] = [];
  public auditTrailsData: AuditTrail[] = [];
  public headersFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public AuditTrailsTable: typeof AuditTrailsTable = AuditTrailsTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private auditTrailsService: AuditTrailsService,
    private fileHandler: FileHandlerService,
    private branchService: BranchService,
    private cdf: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createHeadersGroup() {
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `auditTrails.auditTrailsTable`,
      this.scope,
      this.headers,
      this.fb,
      this,
      7,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case AuditTrailsTable.ACTIONS:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.atype.toLocaleLowerCase() > b.atype.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.COLUMN_NAME:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.colname.toLocaleLowerCase() > b.colname.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.OLD_VALUE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.ovalue?.toLocaleLowerCase() > b.ovalue?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.NEW_VALUE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.nvalue?.toLocaleLowerCase() > b.nvalue?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.POSTED:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.aby?.toLocaleLowerCase() > b.aby?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.AUDIT_DATE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          new Date(a.adate) > new Date(b.adate) ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case AuditTrailsTable.ACTIONS:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.atype.toLocaleLowerCase() < b.atype.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.COLUMN_NAME:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.colname.toLocaleLowerCase() < b.colname.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.OLD_VALUE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.ovalue?.toLocaleLowerCase() < b.ovalue?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.NEW_VALUE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.nvalue?.toLocaleLowerCase() < b.nvalue?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.POSTED:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.aby?.toLocaleLowerCase() < b.aby?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case AuditTrailsTable.AUDIT_DATE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          new Date(a.adate) < new Date(b.adate) ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private createForm() {
    const currentDate = new Date();
    this.formGroup = this.fb.group({
      tbname: this.fb.control(this.selectPageOptions[0], [Validators.required]),
      Startdate: this.fb.control(
        AppUtilities.dateToFormat(
          new Date(
            currentDate.getFullYear() - 4,
            currentDate.getMonth(),
            currentDate.getDate()
          ),
          'yyyy-MM-dd'
        ),
        [Validators.required]
      ),
      Enddate: this.fb.control(
        AppUtilities.dateToFormat(currentDate, 'yyyy-MM-dd'),
        [Validators.required]
      ),
      act: this.fb.control(this.actions[0], [Validators.required]),
      branch: this.fb.control(this.userProfile.braid, []),
    });
    if (Number(this.userProfile.braid) > 0) {
      this.branch.disable();
    }
  }
  private formErrors(
    errorsPath: string = 'reports.auditTrails.form.errors.dialog'
  ) {
    if (this.tbname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.selectPage`)
      );
    }
    if (this.act.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.action`)
      );
    }
    if (this.Startdate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.validDate`)
      );
    }
    if (this.Enddate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.validDate`)
      );
    }
  }
  private reformatDate(values: string[]) {
    let [year, month, date] = values;
    return `${date}/${month}/${year}`;
  }
  private filterAuditTrailsRequest(value: AuditTrailsReportForm) {
    this.startLoading = true;
    this.auditTrailsService
      .getDetails(value)
      .then((results) => {
        if (
          typeof results.response === 'string' ||
          typeof results.response === 'number'
        ) {
          this.auditTrailsData = [];
          this.auditTrails = this.auditTrailsData;
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
        } else {
          this.auditTrailsData = results.response;
          this.auditTrails = this.auditTrailsData;
        }
        this.startLoading = false;
        this.cdf.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdf.detectChanges();
        throw err;
      });
  }
  private audiTrailKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(AuditTrailsTable.ACTIONS)) {
      keys.push('atype');
    }
    if (indexes.includes(AuditTrailsTable.COLUMN_NAME)) {
      keys.push('colname');
    }
    if (indexes.includes(AuditTrailsTable.OLD_VALUE)) {
      keys.push('ovalue');
    }
    if (indexes.includes(AuditTrailsTable.NEW_VALUE)) {
      keys.push('nvalue');
    }
    if (indexes.includes(AuditTrailsTable.NEW_VALUE)) {
      keys.push('nvalue');
    }
    if (indexes.includes(AuditTrailsTable.POSTED)) {
      keys.push('aby');
    }
    if (indexes.includes(AuditTrailsTable.AUDIT_DATE)) {
      keys.push('adate');
    }
    return keys;
  }
  private getActiveTableKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.audiTrailKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let keys = this.getActiveTableKeys();
      let text = searchText.trim().toLowerCase();
      this.auditTrails = this.auditTrailsData.filter((userReportLog: any) => {
        return keys.some((key) =>
          userReportLog[key]?.toLowerCase().includes(text)
        );
      });
    } else {
      this.auditTrails = this.auditTrailsData;
    }
  }
  private buildPage() {
    this.startLoading = true;
    let branchesObs = from(this.branchService.postBranchList({}));
    let res = AppUtilities.pipedObservables(zip(branchesObs));
    res
      .then((results) => {
        let [branches] = results;
        if (
          typeof branches.response !== 'string' &&
          typeof branches.response !== 'number'
        ) {
          this.branches = branches.response;
        }
        this.startLoading = false;
        this.cdf.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdf.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createForm();
    this.createHeadersGroup();
    this.buildPage();
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  submitFilter() {
    if (this.formGroup.valid) {
      let value = { ...this.formGroup.value };
      value.Startdate = this.reformatDate(
        this.formGroup.value.Startdate.split('-')
      );
      value.Enddate = this.reformatDate(
        this.formGroup.value.Enddate.split('-')
      );
      value.branch = this.branch.value;
      this.filterAuditTrailsRequest(value);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  downloadSheet() {
    if (this.auditTrailsData.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.auditTrailsData,
        this.getActiveTableKeys(),
        'audit_trails_report',
        ['adate']
      );
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  get tbname() {
    return this.formGroup.get('tbname') as FormControl;
  }
  get Startdate() {
    return this.formGroup.get('Startdate') as FormControl;
  }
  get Enddate() {
    return this.formGroup.get('Enddate') as FormControl;
  }
  get act() {
    return this.formGroup.get('act') as FormControl;
  }
  get branch() {
    return this.formGroup.get('branch') as FormControl;
  }
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get(`tableSearch`) as FormControl;
  }
}
