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
import { timer } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { CountryDialogComponent } from 'src/app/components/dialogs/bank/setup/country-dialog/country-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { Country } from 'src/app/core/models/bank/country';
import { LoginResponse } from 'src/app/core/models/login-response';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-country-list',
  templateUrl: './country-list.component.html',
  styleUrls: ['./country-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    NgxLoadingModule,
    MatDialogModule,
    TableDateFiltersComponent,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    LoaderRainbowComponent,
    RemoveItemDialogComponent,
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
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public countryForm!: FormGroup;
  public headersMap = {
    SNO: 0,
    COUNTRY_NAME: 1,
  };
  private userProfile = JSON.parse(
    localStorage.getItem('userProfile') as string
  ) as LoginResponse;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('diplayMessageBox') diplayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private client: RequestClientService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersForm() {
    this.countryForm = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.translocoService
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
  private getCountryList() {
    this.startLoading = true;
    this.client.performPost(`/api/Country/getCountries`, {}).subscribe({
      next: (result: any) => {
        this.startLoading = false;
        this.countries = result.response as Country[];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.startLoading = false;
        AppUtilities.openDisplayMessageBox(
          this.diplayMessageBox,
          this.translocoService.translate(`errors.errorOccured`),
          this.translocoService.translate(`errors.verifyConnection`)
        );
        throw err;
      },
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
  private addCountry(country: any) {
    this.startLoading = true;
    this.client.performPost(`/api/Country/AddCountry`, country).subscribe({
      next: (result) => {
        this.startLoading = false;
        if (parseInt(country.sno) === 0) {
          this.successMessageBox.title = this.translocoService.translate(
            `setup.countryDialog.form.dialog.addedSuccessfully`
          );
        } else {
          this.successMessageBox.title = this.translocoService.translate(
            `setup.countryDialog.form.dialog.addedSuccessfully`
          );
        }
        let dialog = this.successMessageBox.openDialog();
        timer(2000).subscribe(() => {
          dialog.close();
          this.getCountryList();
        });
      },
      error: (err) => {
        this.startLoading = false;
        AppUtilities.openDisplayMessageBox(
          this.diplayMessageBox,
          this.translocoService.translate(`errors.errorOccured`),
          this.translocoService.translate(`errors.verifyConnection`)
        );
        throw err;
      },
    });
  }
  private removeCountry(data: any) {
    this.startLoading = true;
    this.client.performPost(`/api/Country/DeleteCount`, data).subscribe({
      next: (result) => {
        this.startLoading = false;
        this.successMessageBox.title = this.translocoService.translate(
          `setup.countryDialog.form.dialog.removedSuccessfully`
        );
        let dialog = this.successMessageBox.openDialog();
        timer(2000).subscribe(() => {
          this.getCountryList();
          dialog.close();
        });
      },
      error: (err) => {
        this.startLoading = false;
        AppUtilities.openDisplayMessageBox(
          this.diplayMessageBox,
          this.translocoService.translate(`errors.errorOccured`),
          this.translocoService.translate(`errors.verifyConnection`)
        );
        throw err;
      },
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
    dialog.title = this.translocoService.translate(
      `setup.countryDialog.form.dialog.removeCountry`
    );
    dialog.message = this.translocoService.translate(
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
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
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
      this.countries = this.countries.filter((elem) => {
        return elem.Country_Name.toLocaleLowerCase().includes(
          searchText.toLocaleLowerCase()
        );
      });
    } else {
      this.getCountryList();
    }
  }
  get headers() {
    return this.countryForm.get('headers') as FormArray;
  }
}
