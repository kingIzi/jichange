import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { EmailTextDialogComponent } from 'src/app/components/dialogs/bank/setup/email-text-dialog/email-text-dialog.component';

@Component({
  selector: 'app-email-text-list',
  templateUrl: './email-text-list.component.html',
  styleUrls: ['./email-text-list.component.scss'],
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
export class EmailTextListComponent {
  public startLoading: boolean = false;
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public emailtexts: any[] = [];
  constructor(private dialog: MatDialog) {}
  openEmailTextForm() {
    let dialogRef = this.dialog.open(EmailTextDialogComponent, {
      width: '600px',
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
}
