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
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { SuspenseAccountDialogComponent } from 'src/app/components/dialogs/bank/setup/suspense-account-dialog/suspense-account-dialog.component';
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
import { SuspenseAccountService } from 'src/app/core/services/bank/setup/suspense-account/suspense-account.service';
import { TimeoutError } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuspenseAccount } from 'src/app/core/models/bank/setup/suspense-account';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { SuspenseAccountTable } from 'src/app/core/enums/bank/setup/suspense-account-table';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-suspense-account-list',
  templateUrl: './suspense-account-list.component.html',
  styleUrls: ['./suspense-account-list.component.scss'],
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
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class SuspenseAccountListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  public suspenseAccounts: SuspenseAccount[] = [];
  public suspenseAccountsData: SuspenseAccount[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public SuspenseAccountTable: typeof SuspenseAccountTable =
    SuspenseAccountTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private suspenseAccountService: SuspenseAccountService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `suspenseAccount.suspenseAccountsTable`,
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
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      default:
        break;
    }
  }
  private requestSuspenseAccountList(form: {}) {
    this.tableLoading = true;
    this.suspenseAccountService
      .getSuspenseAccountList(form)
      .then((res: any) => {
        this.suspenseAccountsData = res.response === 0 ? [] : res.response;
        this.suspenseAccounts = this.suspenseAccountsData;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.tableLoading = false;
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.cdr.detectChanges();
        throw err;
      });
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.toLocaleLowerCase();
      this.suspenseAccounts = this.suspenseAccountsData.filter((account) => {
        return (
          account?.Sus_Acc_No?.toLocaleLowerCase().includes(text) ||
          account?.Status?.toLocaleLowerCase().includes(text)
        );
      });
    } else {
      this.suspenseAccounts = this.suspenseAccountsData;
    }
  }
  ngOnInit(): void {
    this.createHeadersFormGroup();
    this.requestSuspenseAccountList({});
  }
  openAddSuspenseAccountDialog() {
    let dialogRef = this.dialog.open(SuspenseAccountDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        suspenseAccount: null,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  openEditSuspenseAccountDialog(suspenseAccount: SuspenseAccount) {
    let dialogRef = this.dialog.open(SuspenseAccountDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        suspenseAccount: suspenseAccount,
      },
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
