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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TimeoutError } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { CurrencyDialogComponent } from 'src/app/components/dialogs/bank/setup/currency-dialog/currency-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { CurrencyTable } from 'src/app/core/enums/bank/setup/currency-table';
import { RemoveCurrencyForm } from 'src/app/core/models/bank/forms/setup/currency/remove-currency-form';
import { Currency } from 'src/app/core/models/bank/setup/currency';
import { LoginResponse } from 'src/app/core/models/login-response';
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
  public currenciesData: Currency[] = [];
  public currencies: Currency[] = [];
  private userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CurrencyTable: typeof CurrencyTable = CurrencyTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
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
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `currency.currenciesTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case CurrencyTable.CODE:
        this.currencies.sort((a, b) =>
          a.Currency_Code.toLocaleLowerCase() >
          b.Currency_Code.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CurrencyTable.NAME:
        this.currencies.sort((a, b) =>
          a.Currency_Name.toLocaleLowerCase() >
          b.Currency_Name.toLocaleLowerCase()
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
      case CurrencyTable.CODE:
        this.currencies.sort((a, b) =>
          a.Currency_Code.toLocaleLowerCase() <
          b.Currency_Code.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CurrencyTable.NAME:
        this.currencies.sort((a, b) =>
          a.Currency_Name.toLocaleLowerCase() <
          b.Currency_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.toLocaleLowerCase();
      this.currencies = this.currenciesData.filter((currency) => {
        return (
          currency.Currency_Code.toLocaleLowerCase().includes(text) ||
          currency.Currency_Name.toLocaleLowerCase().includes(text)
        );
      });
    } else {
      this.currencies = this.currenciesData;
    }
  }
  private requestCurrencyList() {
    this.tableLoading = true;
    this.currencyService
      .getCurrencyList({})
      .then((result) => {
        this.currenciesData = result.response;
        this.currencies = this.currenciesData;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
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
          let dialog = AppUtilities.openSuccessMessageBox(
            this.successMessageBox,
            this.tr.translate(`setup.currency.currencyRemovedSuccessfully`)
          );
          dialog.addEventListener('close', () => {
            this.requestCurrencyList();
          });
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
