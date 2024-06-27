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
import { NgxLoadingModule } from 'ngx-loading';
import { Observable, of } from 'rxjs';
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
import { EmailText } from 'src/app/core/models/bank/setup/email-text';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { EmailTextService } from 'src/app/core/services/bank/setup/email-text/email-text.service';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class EmailTextListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  // public emailtexts: EmailText[] = [];
  // public emailtextsData: EmailText[] = [];
  public tableData: {
    emailtexts: EmailText[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<EmailText>;
  } = {
    emailtexts: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<EmailText>([]),
  };
  public tableFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public EmailTextTable: typeof EmailTextTable = EmailTextTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private emailTextService: EmailTextService,
    @Inject(TRANSLOCO_SCOPE) public scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableHeaders() {
    let TABLE_SHOWING = 5;
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    // TableUtilities.createHeaders(
    //   this.tr,
    //   `emailText.emailTextsTable`,
    //   this.scope,
    //   this.headers,
    //   this.fb,
    //   this,
    //   3
    // );
    this.tr
      .selectTranslate(`emailText.emailTextsTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  // private sortTableAsc(ind: number) {
  //   switch (ind) {
  //     case EmailTextTable.CREATED:
  //       this.emailtexts.sort((a, b) =>
  //         new Date(a?.Effective_Date).toLocaleDateString().toLocaleLowerCase() >
  //         new Date(b?.Effective_Date).toLocaleDateString().toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmailTextTable.SUBJECT_ENGLISH:
  //       this.emailtexts.sort((a, b) =>
  //         a?.Subject.toLocaleLowerCase() > b?.Subject.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmailTextTable.EMAL_TEXT_ENGLISH:
  //       this.emailtexts.sort((a, b) =>
  //         a?.Email_Text.toLocaleLowerCase() > b?.Email_Text.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmailTextTable.SUBJECT_KISWAHILI:
  //       this.emailtexts.sort((a, b) =>
  //         a?.Local_subject.toLocaleLowerCase() >
  //         b?.Local_subject.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmailTextTable.EMAIL_TEXT_KISWAHILI:
  //       this.emailtexts.sort((a, b) =>
  //         a?.Local_Text.toLocaleLowerCase() > b?.Local_Text.toLocaleLowerCase()
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
  //     case EmailTextTable.CREATED:
  //       this.emailtexts.sort((a, b) =>
  //         new Date(a?.Effective_Date).toLocaleDateString().toLocaleLowerCase() <
  //         new Date(b?.Effective_Date).toLocaleDateString().toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmailTextTable.SUBJECT_ENGLISH:
  //       this.emailtexts.sort((a, b) =>
  //         a?.Subject.toLocaleLowerCase() < b?.Subject.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmailTextTable.EMAL_TEXT_ENGLISH:
  //       this.emailtexts.sort((a, b) =>
  //         a?.Email_Text.toLocaleLowerCase() < b?.Email_Text.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmailTextTable.SUBJECT_KISWAHILI:
  //       this.emailtexts.sort((a, b) =>
  //         a?.Local_subject.toLocaleLowerCase() <
  //         b?.Local_subject.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case EmailTextTable.EMAIL_TEXT_KISWAHILI:
  //       this.emailtexts.sort((a, b) =>
  //         a?.Local_Text.toLocaleLowerCase() < b?.Local_Text.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     default:
  //       break;
  //   }
  // }
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: EmailText,
      filter: string
    ) => {
      return data.Subject &&
        data.Subject.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
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
    this.tableData.dataSource = new MatTableDataSource<EmailText>(
      this.tableData.emailtexts
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private requestEmailTextList() {
    this.tableLoading = true;
    this.emailTextService
      .getAllEmailTextList({})
      .then((result) => {
        // if (
        //   result.response &&
        //   typeof result.response !== 'number' &&
        //   typeof result.response !== 'string'
        // ) {
        //   this.emailtextsData = result.response;
        //   this.emailtexts = this.emailtextsData;
        // }
        // this.tableLoading = false;
        // this.cdr.detectChanges();
        if (result.response instanceof Array) {
          this.tableData.emailtexts = result.response;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.emailtexts = [];
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
  private requestRemoveEmailText(body: RemoveEmailTextForm) {
    this.startLoading = true;
    this.emailTextService
      .deleteEmailText(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response === 'number' &&
          result.response == body.sno
        ) {
          let m = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`setup.emailText.deletedEmailText`)
          );
          this.requestEmailTextList();
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
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeaders();
    this.requestEmailTextList();
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
          this.tableData.emailtexts,
          element
        );
      case 'Effective_Date':
        return new Date(element[key]).toDateString();
      default:
        return element[key];
    }
  }
  openEmailTextForm() {
    let dialogRef = this.dialog.open(EmailTextDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        emailText: null,
      },
    });
    dialogRef.componentInstance.addedEmailText.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestEmailTextList();
    });
  }
  openEditEmailTextForm(emailText: EmailText) {
    let dialogRef = this.dialog.open(EmailTextDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        emailText: emailText,
      },
    });
    dialogRef.componentInstance.addedEmailText.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestEmailTextList();
    });
  }
  openRemoveDialog(emailText: EmailText, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.emailText.removeEmailText`);
    dialog.message = this.tr.translate(`setup.emailText.sureRemoveEmailText`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: emailText.SNO,
        userid: this.userProfile.Usno,
      };
      this.requestRemoveEmailText(data);
    });
  }
  get headers() {
    return this.tableFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
