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
import { TimeoutError } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DepositAccountTable } from 'src/app/core/enums/bank/setup/deposit-account-table';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';

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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class DepositAccountListComponent implements OnInit {
  public tableHeadersFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public depositAccountsData: DepositAccount[] = [];
  public depositAccounts: DepositAccount[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  public DepositAccountTable: typeof DepositAccountTable = DepositAccountTable;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private depositAccountService: DepositAccountService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private requestDepositAccountList() {
    this.tableLoading = true;
    this.depositAccountService
      .getDepositAccountList({})
      .then((result) => {
        this.tableLoading = false;
        this.depositAccountsData = result.response;
        this.depositAccounts = this.depositAccountsData;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.tableLoading = false;
        this.cdr.detectChanges();
      });
  }
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `depositAccount.depositAccountTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case DepositAccountTable.VENDOR:
        this.depositAccounts.sort((a, b) =>
          a?.Company.toLocaleLowerCase() > b?.Company.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DepositAccountTable.ACCOUNT:
        this.depositAccounts.sort((a, b) =>
          a?.Deposit_Acc_No.toLocaleLowerCase() >
          b?.Deposit_Acc_No.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DepositAccountTable.REASON:
        this.depositAccounts.sort((a: any, b: any) =>
          a?.Reason?.toLocaleLowerCase() > b?.Reason?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case DepositAccountTable.VENDOR:
        this.depositAccounts.sort((a, b) =>
          a?.Company.toLocaleLowerCase() < b?.Company.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DepositAccountTable.ACCOUNT:
        this.depositAccounts.sort((a, b) =>
          a?.Deposit_Acc_No.toLocaleLowerCase() <
          b?.Deposit_Acc_No.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DepositAccountTable.REASON:
        this.depositAccounts.sort((a: any, b: any) =>
          a?.Reason?.toLocaleLowerCase() < b?.Reason?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.toLocaleLowerCase();
      this.depositAccounts = this.depositAccountsData.filter(
        (depositAccount) => {
          return (
            depositAccount.Company.toLocaleLowerCase().includes(text) ||
            depositAccount?.Deposit_Acc_No.toLocaleLowerCase().includes(text) ||
            depositAccount?.Reason?.toLocaleLowerCase().includes(text)
          );
        }
      );
    } else {
      this.depositAccounts = this.depositAccountsData;
    }
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.requestDepositAccountList();
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
