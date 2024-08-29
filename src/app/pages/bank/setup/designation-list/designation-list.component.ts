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
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DesignationDialogComponent } from 'src/app/components/dialogs/bank/setup/designation-dialog/designation-dialog.component';
import { BreadcrumbService } from 'xng-breadcrumb';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { DesignationService } from 'src/app/core/services/bank/setup/designation/designation.service';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Designation } from 'src/app/core/models/bank/setup/designation';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { Observable, TimeoutError, of } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { RemoveDistrictForm } from 'src/app/core/models/bank/forms/setup/district/remove-district-form';
import { RemoveDesignationForm } from 'src/app/core/models/bank/forms/setup/designation/remove-designation-form';
import { DesignationTable } from 'src/app/core/enums/bank/setup/designation-table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { Branch } from '@langchain/core/runnables';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-designation-list',
  templateUrl: './designation-list.component.html',
  styleUrls: ['./designation-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    LoaderRainbowComponent,
    RemoveItemDialogComponent,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
  ],
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
export class DesignationListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public DesignationTable: typeof DesignationTable = DesignationTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private designationService: DesignationService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Designation>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 5;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`designation.designationsTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
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
    let filterPredicate = (data: Designation, filter: string) => {
      return data.Desg_Name &&
        data.Desg_Name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseDesignationListResponse(
    result: HttpDataResponse<number | Designation[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Designation[]);
    }
  }
  private requestDesignationList() {
    this.tableLoading = true;
    this.designationService
      .getDesignationList({})
      .then((result) => {
        this.parseDesignationListResponse(result);
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
  private switchDeleteDesignationErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(
          `setup.designation.form.dialog.failedToAddDesignation`
        );
    }
  }
  private parseDeleteDesignationResponse(result: HttpDataResponse<number>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchDeleteDesignationErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let message = this.tr.translate(
        `setup.designation.form.dialog.removedSuccessfully`
      );
      AppUtilities.showSuccessMessage(
        message,
        (e: MouseEvent) => {},
        this.tr.translate('actions.ok')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.Desg_Id === result.response);
      this.tableDataService.removedData(index);
    }
  }
  private requestDeleteDesignation(body: RemoveDesignationForm) {
    this.startLoading = true;
    this.designationService
      .deleteDesignation(body)
      .then((result) => {
        this.parseDeleteDesignationResponse(result);
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
    this.createTableHeadersFormGroup();
    this.requestDesignationList();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Desg_Name':
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
      case 'Desg_Name':
        return `${style} text-black font-semibold`;
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
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  openDesignationDialog() {
    let dialogRef = this.dialog.open(DesignationDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        designationData: null,
      },
    });
    dialogRef.componentInstance.addedDesignation
      .asObservable()
      .subscribe((designation) => {
        dialogRef.close();
        this.tableDataService.addedData(designation);
      });
  }
  openEditDesignationDialog(designation: Designation) {
    let dialogRef = this.dialog.open(DesignationDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        designationData: designation,
      },
    });
    dialogRef.componentInstance.addedDesignation
      .asObservable()
      .subscribe((desg) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex((item) => item.Desg_Id === designation.Desg_Id);
        this.tableDataService.editedData(desg, index);
      });
  }
  openRemoveDialog(
    designation: Designation,
    dialog: RemoveItemDialogComponent
  ) {
    dialog.title = this.tr.translate(
      `setup.designation.form.dialog.removeDesignation`
    );
    dialog.message = this.tr
      .translate(`setup.designation.form.dialog.sureDelete`)
      .replace('{}', designation.Desg_Name);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let body = {
        sno: designation.Desg_Id,
        userid: this.getUserProfile().Usno,
      };
      this.requestDeleteDesignation(body);
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
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
