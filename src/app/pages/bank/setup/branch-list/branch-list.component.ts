import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
  ChangeDetectionStrategy,
  InjectionToken,
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
import {
  MatTableModule,
  MatTableDataSource,
  MatTable,
} from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppConfigService } from 'src/app/core/services/app-config.service';

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
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
    {
      provide: TABLE_DATA_SERVICE,
      useClass: TableDataService,
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
  public branchHeadersForm!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public BranchTable: typeof BranchTable = BranchTable;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Branch>;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private branchService: BranchService,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Branch>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: Branch, filter: string) => {
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
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseBranchListResponse(result: HttpDataResponse<number | Branch[]>) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Branch[]);
    }
  }
  private getBranchList() {
    this.tableLoading = true;
    this.branchService
      .postBranchList({})
      .then((result) => {
        this.parseBranchListResponse(result);
        this.tableDataService.prepareDataSource(this.paginator, this.sort);
        this.dataSourceFilterPredicate();
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
    this.tr
      .selectTranslate(`branch.branchesTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
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
      this.tableDataService.searchTable(value);
    });
  }
  private resetTableColumns() {
    let tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableDataService.setTableColumns(tableColumns);
    this.tableDataService.setTableColumnsObservable(tableColumns);
  }
  private switchDeleteBranchErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(`setup.branch.failedToDeleteBranch`);
    }
  }
  private parseDeleteBranchResponse(result: HttpDataResponse<number>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchDeleteBranchErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let message = this.tr.translate(
        `setup.branch.form.dialog.removedSuccessfully`
      );
      AppUtilities.showSuccessMessage(
        message,
        (e: MouseEvent) => {},
        this.tr.translate('actions.close')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.Sno === result.response);
      this.tableDataService.removedData(index);
    }
  }
  private removeBranch(sno: number) {
    this.startLoading = true;
    this.branchService
      .removeBranch({
        sno: sno,
        userid: this.appConfig.getUserIdFromSessionStorage(),
      })
      .then((result) => {
        this.parseDeleteBranchResponse(result);
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
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
          this.tableDataService.getData(),
          element
        );
      default:
        return element[key];
    }
  }
  openBranchForm() {
    let dialogRef = this.dialog.open(BranchDialogComponent, {
      width: '800px',
      disableClose: true,
    });
    dialogRef.componentInstance.addedBranch
      .asObservable()
      .subscribe((branch) => {
        dialogRef.close();
        this.tableDataService.addedData(branch);
      });
  }
  openEditBranchForm(branch: Branch) {
    let dialogRef = this.dialog.open(BranchDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        branch: branch,
      },
    });
    dialogRef.componentInstance.addedBranch
      .asObservable()
      .subscribe((branch) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex((item) => item.Sno === branch.Sno);
        this.tableDataService.editedData(branch, index);
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
  getTableDataSource() {
    return this.tableDataService.getDataSource();
  }
  getTableDataList() {
    return this.tableDataService.getData();
  }
  getTableDataColumns() {
    return this.tableDataService.getTableColumns();
  }
  geTableDataColumnsObservable() {
    return this.tableDataService.getTableColumnsObservable();
  }
  get headers() {
    return this.branchHeadersForm.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.branchHeadersForm.get('tableSearch') as FormControl;
  }
}
