import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
  flatten,
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { BranchDialogComponent } from 'src/app/components/dialogs/bank/setup/branch-dialog/branch-dialog.component';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { toggle } from 'src/app/pages/auth/auth-animations';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { Statuses } from 'src/app/core/models/status';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { Observable, TimeoutError, of, timer } from 'rxjs';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { BranchTable } from 'src/app/core/enums/bank/setup/branch-table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';

@Component({
  selector: 'app-branch-list',
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    LoaderRainbowComponent,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
    RemoveItemDialogComponent,
    SuccessMessageBoxComponent,
    MatPaginatorModule,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
  animations: [
    toggle,
    listAnimationMobile,
    listAnimationDesktop,
    inOutAnimation,
  ],
})
export class BranchListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  // public branches: Branch[] = [];
  // public branchesData: Branch[] = [];
  public tableData: {
    branches: Branch[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Branch>;
  } = {
    branches: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Branch>([]),
  };
  public branchHeadersForm!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public BranchTable: typeof BranchTable = BranchTable;
  // public headersMap = {
  //   SNO: 0,
  //   BRANCH: 1,
  //   LOCATION: 2,
  //   STATUS: 3,
  // };
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private branchService: BranchService,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Branch,
      filter: string
    ) => {
      return data.Name &&
        data.Name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false ||
          (data.Location &&
            data.Location.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Branch>(
      this.tableData.branches
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private getBranchList() {
    this.tableData.branches = [];
    this.tableLoading = true;
    this.branchService
      .postBranchList({})
      .then((result) => {
        // if (
        //   typeof result.response !== 'string' &&
        //   typeof result.response !== 'number'
        // ) {
        //   this.branchesData = result.response;
        //   this.branches = this.branchesData;
        // } else {
        //   AppUtilities.openDisplayMessageBox(
        //     this.displayMessageBox,
        //     this.tr.translate(`defaults.failed`),
        //     this.tr.translate(`errors.noDataFound`)
        //   );
        // }
        // this.tableLoading = false;
        // this.cdr.detectChanges();
        if (result.response instanceof Array) {
          this.tableData.branches = result.response;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.branches = [];
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
  private createFormHeaders() {
    let TABLE_SHOWING = 5;
    this.branchHeadersForm = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    // TableUtilities.createHeaders(
    //   this.tr,
    //   `branch.branchesTable`,
    //   this.scope,
    //   this.headers,
    //   this.fb,
    //   this
    // );
    this.tr
      .selectTranslate(`branch.branchesTable`, {}, this.scope)
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
  private removeBranch(sno: number) {
    this.tableLoading = true;
    this.branchService
      .removeBranch(sno)
      .then((results: any) => {
        let sal = AppUtilities.sweetAlertSuccessMessage(
          this.tr.translate(`setup.branch.form.dialog.removedSuccessfully`)
        );
        this.getBranchList();
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
  // private sortTableAsc(ind: number): void {
  //   switch (ind) {
  //     case BranchTable.NAME:
  //       this.branches.sort((a, b) =>
  //         a.Name.toLocaleLowerCase() > b.Name.toLocaleLowerCase() ? 1 : -1
  //       );
  //       break;
  //     case BranchTable.LOCATION:
  //       this.branches.sort((a, b) =>
  //         a.Location.toLocaleLowerCase() > b.Location.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case BranchTable.STATUS:
  //       this.branches.sort((a, b) =>
  //         a.Status.toLocaleLowerCase() > b.Status.toLocaleLowerCase() ? 1 : -1
  //       );
  //       break;
  //     default:
  //       break;
  //   }
  // }
  // private sortTableDesc(ind: number): void {
  //   switch (ind) {
  //     case BranchTable.NAME:
  //       this.branches.sort((a, b) =>
  //         a.Name.toLocaleLowerCase() < b.Name.toLocaleLowerCase() ? 1 : -1
  //       );
  //       break;
  //     case BranchTable.LOCATION:
  //       this.branches.sort((a, b) =>
  //         a.Location.toLocaleLowerCase() < b.Location.toLocaleLowerCase()
  //           ? 1
  //           : -1
  //       );
  //       break;
  //     case BranchTable.STATUS:
  //       this.branches.sort((a, b) =>
  //         a.Status.toLocaleLowerCase() < b.Status.toLocaleLowerCase() ? 1 : -1
  //       );
  //       break;
  //     default:
  //       break;
  //   }
  // }
  ngOnInit(): void {
    this.createFormHeaders();
    this.getBranchList();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Name':
      case 'Location':
      case 'Status':
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
      case 'Name':
        return `${style} text-black font-semibold`;
      case 'Status':
        return `${PerformanceUtils.getActiveStatusStyles(
          element[key],
          'Active',
          'bg-green-100',
          'text-green-700',
          'bg-orange-100',
          'text-orange-700'
        )} text-center w-fit`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.branches,
          element
        );
      default:
        return element[key];
    }
  }
  openBranchForm() {
    let dialogRef = this.dialog.open(BranchDialogComponent, {
      width: '600px',
      disableClose: true,
    });
    dialogRef.componentInstance.addedBranch.asObservable().subscribe(() => {
      dialogRef.close();
      this.getBranchList();
    });
  }
  openEditBranchForm(branch: Branch) {
    let dialogRef = this.dialog.open(BranchDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        branch: branch,
      },
    });
    dialogRef.componentInstance.addedBranch.asObservable().subscribe(() => {
      dialogRef.close();
      this.getBranchList();
    });
  }
  openRemoveDialog(branch: Branch, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.branch.form.dialog.removeBranch`);
    dialog.message = this.tr.translate(`setup.branch.form.dialog.sureDelete`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe((e) => {
      this.removeBranch(branch.Sno);
    });
  }
  get headers() {
    return this.branchHeadersForm.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.branchHeadersForm.get('tableSearch') as FormControl;
  }
}
