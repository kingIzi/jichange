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
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { MatTooltipModule } from '@angular/material/tooltip';

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
export class CountryListComponent implements OnInit {
  public startLoading: boolean = false;
  public countryForm!: FormGroup;
  public tableLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CountryTable: typeof CountryTable = CountryTable;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private countryService: CountryService,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Country>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersForm() {
    let TABLE_SHOWING = 5;
    this.countryForm = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`countryDialog.countriesTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
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
    let filterPredicate = (data: Country, filter: string) => {
      return data.Country_Name &&
        data.Country_Name.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        )
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseCountryListResponse(
    result: HttpDataResponse<string | number | Country[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Country[]);
    }
  }
  private getCountryList() {
    this.tableLoading = true;
    this.countryService
      .getCountryList({})
      .then((result) => {
        this.parseCountryListResponse(result);
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
  private switchDeleteBranchErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(`setup.countryDialog.failedToDeleteCountry`);
    }
  }
  private parseDeleteCountryResponse(result: HttpDataResponse<number>) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      let errorMessage = this.switchDeleteBranchErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      // let sal = AppUtilities.sweetAlertSuccessMessage(
      //   this.tr.translate(`setup.countryDialog.form.dialog.removedSuccessfully`)
      // );
      let message = this.tr.translate(
        `setup.countryDialog.form.dialog.removedSuccessfully`
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
  private async requestRemoveCountry(body: {
    sno: number | string;
    userid: number | string;
  }) {
    this.startLoading = true;
    this.countryService
      .deleteCountry(body)
      .then((result) => {
        console.log(result);
        this.parseDeleteCountryResponse(result);
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
    this.createHeadersForm();
    this.getCountryList();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
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
          this.tableDataService.getData(),
          element
        );
      default:
        return element[key];
    }
  }
  openAddCountryDialog() {
    let dialogRef = this.dialog.open(CountryDialogComponent, {
      width: '800px',
      disableClose: true,
    });
    dialogRef.componentInstance.addedCountry
      .asObservable()
      .subscribe((country) => {
        dialogRef.close();
        this.tableDataService.addedData(country);
      });
  }
  openEditCountryDialog(country: Country) {
    let dialogRef = this.dialog.open(CountryDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        country: country,
      },
    });
    dialogRef.componentInstance.addedCountry
      .asObservable()
      .subscribe((country) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex((item) => item.SNO === country.SNO);
        this.tableDataService.editedData(country, index);
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
        userid: this.getUserProfile().Usno,
      };
      this.requestRemoveCountry(data);
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
    return this.countryForm.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.countryForm.get('tableSearch') as FormControl;
  }
}
