import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { SmtpDialogComponent } from 'src/app/components/dialogs/bank/setup/smtp-dialog/smtp-dialog.component';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-smtp-list',
  templateUrl: './smtp-list.component.html',
  styleUrls: ['./smtp-list.component.scss'],
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
export class SmtpListComponent implements OnInit {
  public startLoading: boolean = false;
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public smtps: any[] = [];
  constructor(private dialog: MatDialog) {}
  ngOnInit(): void {}
  openSmtpForm() {
    let dialogRef = this.dialog.open(SmtpDialogComponent, {
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
