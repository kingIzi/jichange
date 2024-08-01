import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DepositAccountDialogComponent } from 'src/app/components/dialogs/bank/setup/deposit-account-dialog/deposit-account-dialog.component';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { DepositAccount } from 'src/app/core/models/bank/setup/deposit-account';
import { DepositAccountService } from 'src/app/core/services/bank/setup/deposit-account/deposit-account.service';
import { Observable, TimeoutError, of } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DepositAccountTable } from 'src/app/core/enums/bank/setup/deposit-account-table';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-deposit-account-list',
  templateUrl: './deposit-account-list.component.html',
  styleUrls: ['./deposit-account-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    RemoveItemDialogComponent,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class DepositAccountListComponent implements OnInit {
  public tableHeadersFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public tableData: {
    depositAccounts: DepositAccount[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<DepositAccount>;
  } = {
    depositAccounts: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<DepositAccount>([]),
  };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  public DepositAccountTable: typeof DepositAccountTable = DepositAccountTable;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private depositAccountService: DepositAccountService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: DepositAccount,
      filter: string
    ) => {
      return data.Company &&
        data.Company.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false ||
          (data.Deposit_Acc_No &&
            data.Deposit_Acc_No.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<DepositAccount>(
      this.tableData.depositAccounts
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private requestDepositAccountList() {
    this.tableLoading = true;
    this.depositAccountService
      .getDepositAccountList({})
      .then((result) => {
        if (result.response instanceof Array) {
          this.tableData.depositAccounts = result.response;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.depositAccounts = [];
        }
        this.prepareDataSource();
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 5;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`depositAccount.depositAccountTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
          let col = this.fb.group({
            included: this.fb.control(index < TABLE_SHOWING, []),
            label: this.fb.control(column.label, []),
            value: this.fb.control(column.value, []),
          });
          col.get(`included`)?.valueChanges.subscribe((included) => {
            this.resetTableColumns();
          });
          if (index === labels.length - 1) {
            col.disable();
          }
          this.headers.push(col);
        });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableData.tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.requestDepositAccountList();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Company':
      case 'Deposit_Acc_No':
      case 'Reason':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Action':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Deposit_Acc_No':
        return `${style} text-black font-semibold`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.depositAccounts,
          element
        );
      default:
        return element[key];
    }
  }
  openDepositForm() {
    let dialogRef = this.dialog.open(DepositAccountDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        depositAccount: null,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestDepositAccountList();
    });
  }
  openRemoveDepositAccount(
    depositAccount: DepositAccount,
    dialog: RemoveItemDialogComponent
  ) {
    dialog.title = this.tr.translate(
      `setup.depositAccount.form.dialog.removeAccount`
    );
    dialog.message = this.tr.translate(
      `setup.depositAccount.form.dialog.sureRemoveAccount`
    );
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      alert('Delete question');
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get(`tableSearch`) as FormControl;
  }
}
