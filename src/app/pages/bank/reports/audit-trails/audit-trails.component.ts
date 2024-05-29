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
import { TimeoutError } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { AuditTrailsTable } from 'src/app/core/enums/bank/reports/audit-trails-table';
import { AuditTrailsReportForm } from 'src/app/core/models/bank/forms/reports/audit-trails-report-form';

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
  public auditTrails: AuditTrail[] = [];
  public auditTrailsData: AuditTrail[] = [];
  public headersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public AuditTrailsTable: typeof AuditTrailsTable = AuditTrailsTable;
  public headersMap = {
    ACTIONS: 0,
    COLUMN_NAME: 1,
    OLD_VALUE: 2,
    NEW_VALUE: 3,
    POSTED: 4,
    AUDIT_DATE: 5,
  };
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    //private client: RequestClientService,
    private auditTrailsService: AuditTrailsService,
    private cdf: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
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
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case this.headersMap.ACTIONS:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.atype.toLocaleLowerCase() > b.atype.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.COLUMN_NAME:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.colname.toLocaleLowerCase() > b.colname.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.OLD_VALUE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.ovalue?.toLocaleLowerCase() > b.ovalue?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.NEW_VALUE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.nvalue?.toLocaleLowerCase() > b.nvalue?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.POSTED:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.aby?.toLocaleLowerCase() > b.aby?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.AUDIT_DATE:
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
      case this.headersMap.ACTIONS:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.atype.toLocaleLowerCase() < b.atype.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.COLUMN_NAME:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.colname.toLocaleLowerCase() < b.colname.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.OLD_VALUE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.ovalue?.toLocaleLowerCase() < b.ovalue?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.NEW_VALUE:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.nvalue?.toLocaleLowerCase() < b.nvalue?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.POSTED:
        this.auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
          a.aby?.toLocaleLowerCase() < b.aby?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.AUDIT_DATE:
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
    });
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let search = searchText.toLocaleLowerCase();
      this.auditTrails = this.auditTrails.filter((elem: AuditTrail) => {
        return (
          elem.ovalue?.toLocaleLowerCase().includes(search) ||
          elem.nvalue?.toLocaleLowerCase().includes(search) ||
          elem.atype?.toLocaleLowerCase().includes(search) ||
          elem.colname?.toLocaleLowerCase().includes(search) ||
          elem.aby?.toLocaleLowerCase().includes(search)
        );
      });
    } else {
      this.auditTrails = this.auditTrailsData;
    }
  }
  ngOnInit(): void {
    this.createForm();
    this.createHeadersGroup();
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
      this.filterAuditTrailsRequest(value);
    } else {
      this.formGroup.markAllAsTouched();
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
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get(`tableSearch`) as FormControl;
  }
}
