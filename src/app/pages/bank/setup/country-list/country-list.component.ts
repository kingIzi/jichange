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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import {
  Observable,
  TimeoutError,
  firstValueFrom,
  lastValueFrom,
  of,
  timer,
} from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { CountryDialogComponent } from 'src/app/components/dialogs/bank/setup/country-dialog/country-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { Country } from 'src/app/core/models/bank/setup/country';
import { LoginResponse } from 'src/app/core/models/login-response';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { CountryService } from 'src/app/core/services/bank/setup/country/country.service';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { CountryTable } from 'src/app/core/enums/bank/setup/country-table';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';

@Component({
  selector: 'app-country-list',
  templateUrl: './country-list.component.html',
  styleUrls: ['./country-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    NgxLoadingModule,
    MatDialogModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    LoaderRainbowComponent,
    RemoveItemDialogComponent,
    MatPaginatorModule,
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
export class CountryListComponent implements OnInit {
  public startLoading: boolean = false;
  // public countries: Country[] = [];
  // public countriesData: Country[] = [];
  public tableData: {
    countries: Country[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Country>;
  } = {
    countries: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Country>([]),
  };
  public countryForm!: FormGroup;
  public tableLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CountryTable: typeof CountryTable = CountryTable;
  private userProfile!: LoginResponse;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private countryService: CountryService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createHeadersForm() {
    let TABLE_SHOWING = 5;
    this.countryForm = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`countryDialog.countriesTable`, {}, this.scope)
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
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Country,
      filter: string
    ) => {
      return data.Country_Name &&
        data.Country_Name.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        )
        ? true
        : false;
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Country>(
      this.tableData.countries
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private getCountryList() {
    this.tableData.countries = [];
    this.tableLoading = true;
    this.countryService
      .getCountryList({})
      .then((results) => {
        if (results.response instanceof Array) {
          this.tableData.countries = results.response as Country[];
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.countries = [];
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
  private async requestRemoveCountry(body: {
    sno: number | string;
    userid: number | string;
  }) {
    this.startLoading = true;
    this.countryService
      .deleteCountry(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response === 'number' &&
          result.response > 0
        ) {
          let d = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(
              `setup.countryDialog.form.dialog.removedSuccessfully`
            )
          );
          this.getCountryList();
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeadersForm();
    this.getCountryList();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Country_Name':
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
      case 'Country_Name':
        return `${style} text-black font-semibold`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.countries,
          element
        );
      default:
        return element[key];
    }
  }
  openAddCountryDialog() {
    let dialogRef = this.dialog.open(CountryDialogComponent, {
      width: '600px',
      disableClose: true,
    });
    dialogRef.componentInstance.addedCountry
      .asObservable()
      .subscribe((country) => {
        this.getCountryList();
        dialogRef.close();
      });
  }
  openEditCountryDialog(country: Country) {
    let dialogRef = this.dialog.open(CountryDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        country: country,
      },
    });
    dialogRef.componentInstance.addedCountry
      .asObservable()
      .subscribe((country) => {
        this.getCountryList();
        dialogRef.close();
      });
  }
  openRemoveDialog(country: Country, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(
      `setup.countryDialog.form.dialog.removeCountry`
    );
    dialog.message = this.tr.translate(
      `setup.countryDialog.form.dialog.sureDelete`
    );
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: country.SNO,
        userid: this.userProfile.Usno,
      };
      this.requestRemoveCountry(data);
    });
  }
  get headers() {
    return this.countryForm.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.countryForm.get('tableSearch') as FormControl;
  }
}
