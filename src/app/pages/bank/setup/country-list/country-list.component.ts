import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { CountryDialogComponent } from 'src/app/components/dialogs/bank/setup/country-dialog/country-dialog.component';

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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class CountryListComponent {
  public startLoading: boolean = false;
  public countries: any[] = [];
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  constructor(private dialog: MatDialog) {}
  openAddCountryDialog() {
    let dialogRef = this.dialog.open(CountryDialogComponent, {
      width: '600px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
}
