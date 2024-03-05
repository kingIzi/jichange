import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { Company } from 'src/app/core/models/company';
import { Ripple, initTE } from 'tw-elements';
import * as json from 'src/assets/temp/data.json';
import { CompanySummaryDialogComponent } from 'src/app/components/dialogs/bank/company/company-summary-dialog/company-summary-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
})
export class SummaryComponent implements OnInit {
  public companies: Company[] = [];
  public companiesData: Company[] = [];
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];

  constructor(private dialog: MatDialog) {}
  ngOnInit(): void {
    initTE({ Ripple });
    let data = JSON.parse(JSON.stringify(json));
    this.companiesData = data.companies;
    this.companies = this.companiesData;
    //this.openCompanySummaryDialog();
  }
  openCompanySummaryDialog() {
    let dialogRef = this.dialog.open(CompanySummaryDialogComponent, {
      width: '800px',
      height: '600px',
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
  searchTable(searchText: string) {
    if (searchText) {
      this.companies = this.companiesData.filter((elem: Company) => {
        return (
          elem.CompName.toLocaleLowerCase().includes(
            searchText.toLocaleLowerCase()
          ) ||
          elem.Address.toLocaleLowerCase().includes(
            searchText.toLocaleLowerCase()
          ) ||
          elem.TelNo.includes(searchText.toLocaleLowerCase()) ||
          elem.MobNo.includes(searchText.toLocaleLowerCase()) ||
          elem.Status.toLocaleLowerCase().includes(
            searchText.toLocaleLowerCase()
          )
        );
      });
    } else {
      this.companies = this.companiesData;
    }
  }
}
