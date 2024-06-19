import { CommonModule } from '@angular/common';
import {
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
import { Observable, TimeoutError, of } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { CurrencyDialogComponent } from 'src/app/components/dialogs/bank/setup/currency-dialog/currency-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { CurrencyTable } from 'src/app/core/enums/bank/setup/currency-table';
import { RemoveCurrencyForm } from 'src/app/core/models/bank/forms/setup/currency/remove-currency-form';
import { Currency } from 'src/app/core/models/bank/setup/currency';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { CurrencyService } from 'src/app/core/services/bank/setup/currency/currency.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-currency-list',
  templateUrl: './currency-list.component.html',
  styleUrls: ['./currency-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    RemoveItemDialogComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class CurrencyListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableFormGroup!: FormGroup;
  // public currenciesData: Currency[] = [];
  // public currencies: Currency[] = [];
  public tableData: {
    currencies: Currency[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Currency>;
  } = {
    currencies: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Currency>([]),
  };
  private userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CurrencyTable: typeof CurrencyTable = CurrencyTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private currencyService: CurrencyService,
    private dialog: MatDialog,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableFormGroup() {
    let TABLE_SHOWING = 5;
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    // TableUtilities.createHeaders(
    //   this.tr,
    //   `currency.currenciesTable`,
    //   this.scope,
    //   this.headers,
    //   this.fb,
    //   this
    // );
    this.tr
      .selectTranslate(`currency.currenciesTable`, {}, this.scope)
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
  // private sortTableAsc(ind: number) {
  //   switch (ind) {
  //     case CurrencyTable.CODE:
  //       this.currencies.sort((a, b) =>
  //         a.Currency_Code.toLocaleLowerCase() >
  //         b.Currency_Code.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case CurrencyTable.NAME:
  //       this.currencies.sort((a, b) =>
  //         a.Currency_Name.toLocaleLowerCase() >
  //         b.Currency_Name.toLocaleLowerCase()
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
  //     case CurrencyTable.CODE:
  //       this.currencies.sort((a, b) =>
  //         a.Currency_Code.toLocaleLowerCase() <
  //         b.Currency_Code.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case CurrencyTable.NAME:
  //       this.currencies.sort((a, b) =>
  //         a.Currency_Name.toLocaleLowerCase() <
  //         b.Currency_Name.toLocaleLowerCase()
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
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Currency,
      filter: string
    ) => {
      return data.Currency_Code &&
        data.Currency_Code.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        )
        ? true
        : false ||
          (data.Currency_Name &&
            data.Currency_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Currency>(
      this.tableData.currencies
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private requestCurrencyList() {
    //this.emptyCurrencyList();
    this.tableData.currencies = [];
    this.tableLoading = true;
    this.currencyService
      .getCurrencyList({})
      .then((result) => {
        // if (
        //   typeof result.response !== 'string' &&
        //   typeof result.response !== 'number'
        // ) {
        //   this.currenciesData = result.response;
        //   this.currencies = this.currenciesData;
        // } else {
        //   AppUtilities.openDisplayMessageBox(
        //     this.displayMessageBox,
        //     this.tr.translate(`defaults.failed`),
        //     this.tr.translate(`errors.noDataFound`)
        //   );
        // }
        // this.tableLoading = false;
        // this.cdr.detectChanges();
        if (result.response instanceof Array) {
          this.tableData.currencies = result.response;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.currencies = [];
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
  private requestRemoveCurrency(form: RemoveCurrencyForm) {
    this.startLoading = true;
    this.currencyService
      .deleteCurrency(form)
      .then((result) => {
        if (
          typeof result.response === 'string' &&
          result.response === form.code
        ) {
          let sal = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`setup.currency.createdCurrencySuccessfully`)
          );
          this.requestCurrencyList();
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableFormGroup();
    this.requestCurrencyList();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Currency_Code':
      case 'Currency_Name':
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
      case 'Currency_Code':
        return `${style} text-black font-semibold`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.currencies,
          element
        );
      default:
        return element[key];
    }
  }
  openCurrencyForm() {
    let dialogRef = this.dialog.open(CurrencyDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        currency: null,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      this.requestCurrencyList();
      dialogRef.close();
    });
  }
  editCurrencyForm(currency: Currency) {
    let dialogRef = this.dialog.open(CurrencyDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        currency: currency,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      this.requestCurrencyList();
      dialogRef.close();
    });
  }
  openRemoveCurrencyDialog(
    currency: Currency,
    dialog: RemoveItemDialogComponent
  ) {
    dialog.title = this.tr.translate(`setup.currency.removeCurrency`);
    dialog.message = this.tr.translate(`setup.currency.sureRemoveCurrency`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      this.requestRemoveCurrency({
        code: currency.Currency_Code,
        userid: this.userProfile.Usno,
      } as RemoveCurrencyForm);
    });
  }
  get headers() {
    return this.tableFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
