import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { Observable, of } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { WardDialogComponent } from 'src/app/components/dialogs/bank/setup/ward-dialog/ward-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { WardTable } from 'src/app/core/enums/bank/setup/ward-table';
import { RemoveWardForm } from 'src/app/core/models/bank/forms/setup/ward/RemoveWard';
import { District } from 'src/app/core/models/bank/setup/district';
import { Ward } from 'src/app/core/models/bank/setup/ward';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { WardService } from 'src/app/core/services/bank/setup/ward/ward.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-ward-list',
  templateUrl: './ward-list.component.html',
  styleUrls: ['./ward-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    ReactiveFormsModule,
    RemoveItemDialogComponent,
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
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class WardListComponent implements OnInit {
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public WardTable: typeof WardTable = WardTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private wardService: WardService,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Ward>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableHeaders() {
    let TABLE_SHOWING = 5;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`wardDialog.wardsTable`, {}, this.scope)
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
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: Ward, filter: string) => {
      return data.Ward_Name &&
        data.Ward_Name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false ||
          (data.District_Name &&
            data.District_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseWardListResponse(result: HttpDataResponse<number | Ward[]>) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Ward[]);
    }
  }
  private requestWardList() {
    this.tableLoading = true;
    this.wardService
      .getAllWardsList({})
      .then((result) => {
        this.parseWardListResponse(result);
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
  private switchDeleteWardErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(`setup.wardDialog.failedToDeleteWard`);
    }
  }
  private parseDeleteWardResponse(result: HttpDataResponse<number>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchDeleteWardErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let message = this.tr.translate(
        'setup.wardDialog.deletedWardSuccessfully'
      );
      AppUtilities.showSuccessMessage(
        message,
        (e: MouseEvent) => {},
        this.tr.translate('actions.ok')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.SNO === result.response);
      this.tableDataService.removedData(index);
    }
  }
  private requestDeleteWard(body: RemoveWardForm) {
    this.startLoading = true;
    this.wardService
      .deleteWard(body)
      .then((result) => {
        this.parseDeleteWardResponse(result);
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
    this.createTableHeaders();
    this.requestWardList();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'District_Name':
      case 'Ward_Name':
      case 'Ward_Status':
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
      case 'Ward_Name':
        return `${style} text-black font-semibold`;
      case 'Ward_Status':
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
  openWardForm() {
    let dialogRef = this.dialog.open(WardDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        ward: null,
      },
    });
    dialogRef.componentInstance.addedWard.asObservable().subscribe((ward) => {
      dialogRef.close();
      this.tableDataService.addedData(ward);
    });
  }
  openEditWardForm(ward: Ward) {
    let dialogRef = this.dialog.open(WardDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        ward: ward,
      },
    });
    dialogRef.componentInstance.addedWard.asObservable().subscribe((ward) => {
      dialogRef.close();
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.SNO === ward.SNO);
      this.tableDataService.editedData(ward, index);
    });
  }
  openRemoveDialog(ward: Ward, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.wardDialog.removeWard`);
    dialog.message = this.tr.translate(`setup.wardDialog.sureRemoveWard`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: ward.SNO,
        userid: this.getUserProfile().Usno,
      };
      this.requestDeleteWard(data);
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
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
