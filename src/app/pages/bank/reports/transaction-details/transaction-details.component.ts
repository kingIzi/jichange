import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { TransactionDetailsEditComponent } from 'src/app/components/dialogs/bank/reports/transaction-details-edit/transaction-details-edit.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { TransactionDetailsTableHeadersMap } from 'src/app/core/enums/bank/reports/transaction-details-table-headers-map';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
//import * as json from 'src/assets/temp/data.json';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RemoveItemDialogComponent,
    TableDateFiltersComponent,
    SuccessMessageBoxComponent,
    ReactiveFormsModule,
    TranslocoModule,
    MatDialogModule,
    RouterModule,
    MatPaginatorModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class TransactionDetailsComponent implements OnInit {
  public headersFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public includedHeaders: any[] = [];
  public transactions: any[] = [];
  public transactionsData: any[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public headersMap = {
    DATE: TransactionDetailsTableHeadersMap.DATE,
    INVOICE_NUMBER: TransactionDetailsTableHeadersMap.INVOICE_NUMBER,
    COMPANY: TransactionDetailsTableHeadersMap.COMPANY,
    DESCRIPTION: TransactionDetailsTableHeadersMap.DESCRIPTION,
    AMOUNT: TransactionDetailsTableHeadersMap.AMOUNT,
    STATUS: TransactionDetailsTableHeadersMap.STATUS,
    TRANSACTION_NUMBER: TransactionDetailsTableHeadersMap.TRANSACTION_NUMBER,
  };
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private translocoService: TranslocoService,
    private router: Router,
    private fileHandler: FileHandlerService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private getTableColumnDataVariations(ind: number) {
    switch (ind) {
      case this.headersMap.COMPANY:
        let companies = new Set(this.transactionsData.map((t) => t.company));
        return [...companies];
      case this.headersMap.STATUS:
        let status = new Set(this.transactionsData.map((t) => t.status));
        return [...status];

      default:
        return [];
    }
  }
  private tableHeaderFilterValues(header: FormGroup, index: number) {
    let values: string[] = this.getTableColumnDataVariations(index);
    values.forEach((elem) => {
      let value = this.fb.group({
        name: this.fb.control(elem.trim(), []),
        isActive: this.fb.control(true, []),
      });
      value.get('isActive')?.valueChanges.subscribe((value) => {
        let filteringIndexes = [
          this.headersMap.COMPANY,
          this.headersMap.STATUS,
        ];
        this.transactions = this.filterTable(filteringIndexes);
      });
      (header.get('values') as FormArray).push(value);
    });
  }
  private filterTable(indexes: number[]) {
    let [COMPANY, STATUS] = indexes;
    let companiesArr = this.headers.at(COMPANY).get('values') as FormArray;
    let statusesArr = this.headers.at(STATUS).get('values') as FormArray;
    let companies = companiesArr.controls
      .filter((c) => c.get('isActive')?.value)
      .map((f) => f.get('name')?.value.toLocaleLowerCase());
    let statuses = statusesArr.controls
      .filter((c) => c.get('isActive')?.value)
      .map((f) => f.get('name')?.value.toLocaleLowerCase());
    if (!companies || !statuses) {
      return [];
    }
    return this.transactionsData.filter((f) => {
      return (
        companies.indexOf(f.company.trim().toLocaleLowerCase()) !== -1 &&
        statuses.indexOf(f.status.trim().toLocaleLowerCase()) !== -1
      );
    });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case this.headersMap.DATE:
        this.transactions.sort((a, b) => (a.date > b.date ? 1 : -1));
        break;
      case this.headersMap.COMPANY:
        this.transactions.sort((a, b) => (a.company > b.company ? 1 : -1));
        break;
      case this.headersMap.DESCRIPTION:
        this.transactions.sort((a, b) =>
          a.description > b.description ? 1 : -1
        );
        break;
      case this.headersMap.AMOUNT:
        this.transactions.sort((a, b) => (a.amount > b.amount ? 1 : -1));
        break;
      case this.headersMap.STATUS:
        this.transactions.sort((a, b) => (a.status > b.status ? 1 : -1));
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case this.headersMap.DATE:
        this.transactions.sort((a, b) => (a.date < b.date ? 1 : -1));
        break;
      case this.headersMap.COMPANY:
        this.transactions.sort((a, b) => (a.company < b.company ? 1 : -1));
        break;
      case this.headersMap.DESCRIPTION:
        this.transactions.sort((a, b) =>
          a.description < b.description ? 1 : -1
        );
        break;
      case this.headersMap.AMOUNT:
        this.transactions.sort((a, b) => (a.amount < b.amount ? 1 : -1));
        break;
      case this.headersMap.STATUS:
        this.transactions.sort((a, b) => (a.status < b.status ? 1 : -1));
        break;
      default:
        break;
    }
  }
  private createHeadersFormGroup() {
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.translocoService
      .selectTranslate(
        'transactionDetails.transactionDetailsTable',
        {},
        this.scope
      )
      .subscribe((labels: string[]) => {
        if (labels && labels.length > 0) {
          labels.forEach((label, index) => {
            let header = this.fb.group({
              label: this.fb.control(label, []),
              sortAsc: this.fb.control(false, []),
              included: this.fb.control(index <= 5, []),
              values: this.fb.array([], []),
            });
            (header.get('included') as FormControl).valueChanges.subscribe(
              (value) => {
                this.includedHeaders = this.headers.controls.filter(
                  (control) => control.get('included')?.value
                );
              }
            );
            this.tableHeaderFilterValues(header, index);
            header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
              if (value === true) {
                this.sortTableAsc(index);
              } else {
                this.sortTableDesc(index);
              }
            });
            this.headers.push(header);
          });
          this.includedHeaders = this.headers.controls.filter(
            (control) => control.get('included')?.value
          );
        }
      });
  }
  ngOnInit(): void {
    //let data = JSON.parse(JSON.stringify(json));
    //this.transactionsData = data.transactionDetails;
    //this.transactions = this.transactionsData;
    this.createHeadersFormGroup();
  }
  //returns true if column index as cash amount as values
  indexIncludedHeader(control: AbstractControl<any, any>) {
    let amountIndexes = [4];
    let found = this.includedHeaders.findIndex((group) => {
      return control === group;
    });
    if (found !== -1) {
      return amountIndexes.includes(found);
    }
    return false;
  }
  //open transaction chart
  openTransactionCharts() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        headersMap: this.headersMap,
        headers: this.headers.controls.map((c) => c.get('label')?.value),
        transactions: this.transactions,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  convertDotNetJSONDate(dotNetJSONDate: string) {
    const timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp);
  }
  downloadSheet() {
    let data = this.transactionsData.map((d) => {
      let t = { ...d };
      t.date = AppUtilities.convertDotNetJsonDateToDate(
        d.date
      ).toLocaleString();
      return t;
    });
    this.fileHandler.exportAsExcelFile(data, 'transaction_details');
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    if (!sortAsc?.value) {
      this.sortTableDesc(ind);
      sortAsc?.setValue(true);
    } else {
      this.sortTableAsc(ind);
      sortAsc?.setValue(false);
    }
  }
  getValueArray(ind: number) {
    return this.headers.controls.at(ind)?.get('values') as FormArray;
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  downloadPdf(ind: number, route: string) {
    this.router.navigate([route], { queryParams: { download: true } });
  }
  removeItem(ind: number, dialog: RemoveItemDialogComponent) {
    dialog.title = 'Remove transaction';
    dialog.message =
      'Are you sure you want to remove this transaction permanently?';
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      this.transactions.splice(ind, 1);
    });
  }
  searchTable(searchText: string) {
    if (searchText) {
      this.transactions = this.transactionsData.filter((elem: any) => {
        return (
          elem.company
            .toLocaleLowerCase()
            .includes(searchText.toLocaleLowerCase()) ||
          elem.description
            .toLocaleLowerCase()
            .includes(searchText.toLocaleLowerCase()) ||
          elem.transactionNumber
            .toLocaleLowerCase()
            .includes(searchText.toLocaleLowerCase()) ||
          elem.status
            .toLocaleLowerCase()
            .includes(searchText.toLocaleLowerCase())
        );
      });
    } else {
      this.transactions = this.transactionsData;
    }
  }
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
}
