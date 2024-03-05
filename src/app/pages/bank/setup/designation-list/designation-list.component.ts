import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DesignationDialogComponent } from 'src/app/components/dialogs/bank/setup/designation-dialog/designation-dialog.component';

@Component({
  selector: 'app-designation-list',
  templateUrl: './designation-list.component.html',
  styleUrls: ['./designation-list.component.scss'],
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
export class DesignationListComponent {
  public startLoading: boolean = false;
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public designations: any[] = [];
  constructor(private dialog: MatDialog) {}
  openDesignationDialog() {
    let dialogRef = this.dialog.open(DesignationDialogComponent, {
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
