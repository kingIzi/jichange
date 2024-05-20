import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    TableDateFiltersComponent,
    ReactiveFormsModule,
    NgxLoadingModule,
    SuccessMessageBoxComponent,
    TranslocoModule,
    MatPaginatorModule,
    LoaderInfiniteSpinnerComponent,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class ListComponent implements OnInit {
  public startLoading: boolean = false;
  public transactions: any[] = [];
  public formGroup!: FormGroup;
  public headersMap = {
    DATE: 0,
    COMPANY: 1,
    TRANSACTION_NUMBER: 2,
    DESCRIPTION: 3,
    AMOUNT: 4,
    STATUS: 5,
  };
  constructor(
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersFormGroup() {
    this.formGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.translocoService
      .selectTranslate(
        `transactionDetails.transactionDetailsTable`,
        {},
        this.scope
      )
      .subscribe((labels) => {
        labels.forEach((label: string, index: number) => {
          let header = this.fb.group({
            label: this.fb.control(label, []),
            search: this.fb.control('', []),
            sortAsc: this.fb.control(false, []),
            values: this.fb.array([], []),
          });
          header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
            if (value === true) {
              //this.sortTableAsc(index);
            } else {
              //this.sortTableDesc(index);
            }
          });
          this.headers.push(header);
        });
      });
  }
  ngOnInit(): void {
    this.createHeadersFormGroup();
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  get headers() {
    return this.formGroup.get('headers') as FormArray;
  }
}
