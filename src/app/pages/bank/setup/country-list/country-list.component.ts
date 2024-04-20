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
import { Country } from 'src/app/core/models/bank/country';
import { LoginResponse } from 'src/app/core/models/login-response';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { CountryService } from 'src/app/core/services/setup/country.service';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';

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
  public headersMap = {
    SNO: 0,
    COUNTRY_NAME: 1,
  };
  private userProfile = JSON.parse(
    localStorage.getItem('userProfile') as string
  ) as LoginResponse;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
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
    });
    this.tr
      .selectTranslate(`countryDialog.countriesTable`, {}, this.scope)
      .subscribe((labels: string[]) => {
        if (labels && labels.length > 0) {
          labels.forEach((label, index) => {
            if (index !== 0) {
              let header = this.fb.group({
                label: this.fb.control(label, []),
                search: this.fb.control('', []),
                sortAsc: this.fb.control('', []),
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
            }
          });
        }
      });
  }
  private async getCountryList() {
    //this.startLoading = true;
    this.tableLoading = true;
    let list = lastValueFrom(await this.countryService.getCountryList({}));
    list
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
      case this.headersMap.COUNTRY_NAME:
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
      case this.headersMap.COUNTRY_NAME:
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
  private async addCountry(country: any) {
    this.startLoading = true;
    let added = lastValueFrom(await this.countryService.addCountry(country));
    added
      .then((results: any) => {
        if (parseInt(country.sno) === 0) {
          this.successMessageBox.title = this.tr.translate(
            `setup.countryDialog.form.dialog.addedSuccessfully`
          );
        } else {
          this.successMessageBox.title = this.tr.translate(
            `setup.countryDialog.form.dialog.addedSuccessfully`
          );
        }
        this.startLoading = false;
        let dialog = this.successMessageBox.openDialog();
        timer(2000).subscribe(() => {
          dialog.close();
          this.getCountryList();
        });
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
  private async removeCountry(country: any) {
    this.startLoading = true;
    let removed = lastValueFrom(await this.countryService.addCountry(country));
    removed
      .then((results: any) => {
        this.startLoading = false;
        this.successMessageBox.title = this.tr.translate(
          `setup.countryDialog.form.dialog.removedSuccessfully`
        );
        let dialog = this.successMessageBox.openDialog();
        timer(2000).subscribe(() => {
          this.getCountryList();
          dialog.close();
        });
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.startLoading = false;
        throw err;
      });
  }
  ngOnInit(): void {
    this.createHeadersForm();
    this.getCountryList();
  }
  openAddCountryDialog() {
    let dialogRef = this.dialog.open(CountryDialogComponent, {
      width: '600px',
    });
    dialogRef.componentInstance.addedCountry
      .asObservable()
      .subscribe((country) => {
        this.addCountry(country);
        dialogRef.close();
      });
  }
  openEditCountryDialog(country: Country) {
    let dialogRef = this.dialog.open(CountryDialogComponent, {
      width: '600px',
      data: {
        country: country,
      },
    });
    dialogRef.componentInstance.addedCountry
      .asObservable()
      .subscribe((country) => {
        this.addCountry(country);
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
      this.removeCountry(data);
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
  searchTable(searchText: string) {
    if (searchText) {
      this.countries = this.countriesData.filter((elem) => {
        return elem.Country_Name.toLocaleLowerCase().includes(
          searchText.toLocaleLowerCase()
        );
      });
    } else {
      this.countries = this.countriesData;
      //this.getCountryList();
    }
  }
  get headers() {
    return this.countryForm.get('headers') as FormArray;
  }
}
