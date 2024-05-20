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
import { TimeoutError, firstValueFrom, lastValueFrom, timer } from 'rxjs';
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
  public countries: Country[] = [];
  public countriesData: Country[] = [];
  public countryForm!: FormGroup;
  public tableLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CountryTable: typeof CountryTable = CountryTable;
  // public headersMap = {
  //   COUNTRY_NAME: 0,
  // };
  private userProfile = JSON.parse(
    localStorage.getItem('userProfile') as string
  ) as LoginResponse;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private countryService: CountryService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersForm() {
    this.countryForm = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `countryDialog.countriesTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private async getCountryList() {
    //this.startLoading = true;
    this.tableLoading = true;
    this.countryService
      .getCountryList({})
      .then((results: any) => {
        if (results.response instanceof Array) {
          this.countriesData = results.response as Country[];
          this.countries = this.countriesData;
        } else {
          this.countriesData = [];
          this.countries = this.countriesData;
        }
        //this.startLoading = false;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        //this.startLoading = false;
        this.tableLoading = false;
        throw err;
      });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case this.CountryTable.NAME:
        this.countries.sort((a, b) =>
          a.Country_Name.toLocaleLowerCase() >
          b.Country_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case this.CountryTable.NAME:
        this.countries.sort((a, b) =>
          a.Country_Name.toLocaleLowerCase() <
          b.Country_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
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
          d.then((res) => {
            this.getCountryList();
          });
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
    if (searchText) {
      paginator.firstPage();
      this.countries = this.countriesData.filter((elem) => {
        return elem.Country_Name.toLocaleLowerCase().includes(
          searchText.toLocaleLowerCase()
        );
      });
    } else {
      this.countries = this.countriesData;
    }
  }
  ngOnInit(): void {
    this.createHeadersForm();
    this.getCountryList();
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
  sortColumnClicked(index: number) {
    let sortAsc = this.headers.at(index).get('sortAsc');
    if (!sortAsc?.value) {
      this.sortTableDesc(index);
      sortAsc?.setValue(true);
    } else {
      this.sortTableAsc(index);
      sortAsc?.setValue(false);
    }
  }
  get headers() {
    return this.countryForm.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.countryForm.get('tableSearch') as FormControl;
  }
}
