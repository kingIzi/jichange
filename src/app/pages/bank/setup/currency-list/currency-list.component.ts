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
import { MatTooltipModule } from '@angular/material/tooltip';
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
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { CurrencyTable } from 'src/app/core/enums/bank/setup/currency-table';
import { RemoveCurrencyForm } from 'src/app/core/models/bank/forms/setup/currency/remove-currency-form';
import { Currency } from 'src/app/core/models/bank/setup/currency';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { CurrencyService } from 'src/app/core/services/bank/setup/currency/currency.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
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
    MatTooltipModule,
  ],
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
export class CurrencyListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CurrencyTable: typeof CurrencyTable = CurrencyTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private currencyService: CurrencyService,
    private dialog: MatDialog,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Currency>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableFormGroup() {
    let TABLE_SHOWING = 5;
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`currency.currenciesTable`, {}, this.scope)
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
  }
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: Currency, filter: string) => {
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
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseCurrencyListResponse(
    result: HttpDataResponse<number | Currency[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Currency[]);
    }
  }
  private requestCurrencyList() {
    this.tableLoading = true;
    this.currencyService
      .getCurrencyList({})
      .then((result) => {
        this.parseCurrencyListResponse(result);
        this.tableDataService.prepareDataSource(this.paginator, this.sort);
        this.dataSourceFilterPredicate();
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
  private switchRemoveCurrencyErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(
          `setup.currency.form.dialog.failedToRemoveCurrency`
        );
    }
  }
  private parseRemoveCurrencyResponse(
    result: HttpDataResponse<string | number>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchRemoveCurrencyErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let message = this.tr.translate(
        `setup.currency.currencyRemovedSuccessfully`
      );
      AppUtilities.showSuccessMessage(
        message,
        (e: MouseEvent) => {},
        this.tr.translate('actions.ok')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex(
          (item) =>
            item.Currency_Code.toLocaleLowerCase() ===
            (result.response as string).toLocaleLowerCase()
        );
      this.tableDataService.removedData(index);
    }
  }
  private requestRemoveCurrency(form: RemoveCurrencyForm) {
    this.startLoading = true;
    this.currencyService
      .deleteCurrency(form)
      .then((result) => {
        this.parseRemoveCurrencyResponse(result);
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
    this.createTableFormGroup();
    this.requestCurrencyList();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
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
          this.tableDataService.getData(),
          element
        );
      default:
        return element[key];
    }
  }
  openCurrencyForm() {
    let dialogRef = this.dialog.open(CurrencyDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        currency: null,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe((currency) => {
      dialogRef.close();
      this.tableDataService.addedData(currency);
    });
  }
  editCurrencyForm(currency: Currency) {
    let dialogRef = this.dialog.open(CurrencyDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        currency: currency,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe((currency) => {
      dialogRef.close();
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex(
          (item) =>
            item.Currency_Code.toLocaleLowerCase() ===
            currency.Currency_Code.toLocaleLowerCase()
        );
      this.tableDataService.editedData(currency, index);
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
        userid: this.getUserProfile().Usno,
      } as RemoveCurrencyForm);
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
