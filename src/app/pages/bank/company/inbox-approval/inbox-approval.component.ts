import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Ripple, initTE } from 'tw-elements';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-inbox-approval',
  templateUrl: './inbox-approval.component.html',
  styleUrls: ['./inbox-approval.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    TableDateFiltersComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
})
export class InboxApprovalComponent implements OnInit {
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  constructor(private translocoService: TranslocoService) {}
  ngOnInit(): void {
    initTE({ Ripple });
  }
  public data: any[] = [];
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
}
