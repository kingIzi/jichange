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
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { Company } from 'src/app/core/models/bank/company';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';

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
    MatPaginatorModule,
    LoaderRainbowComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
})
export class InboxApprovalComponent implements OnInit {
  public startLoading: boolean = false;
  constructor(private translocoService: TranslocoService) {}
  ngOnInit(): void {
    initTE({ Ripple });
  }
  public companies: Company[] = [];
  public companiesData: Company[] = [];
}
