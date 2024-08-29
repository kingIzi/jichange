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
import { DatePickerDialogComponent } from 'src/app/components/dialogs/date-picker-dialog/date-picker-dialog.component';
import { RegionDialogComponent } from 'src/app/components/dialogs/bank/setup/region-dialog/region-dialog.component';
import { BreadcrumbService } from 'xng-breadcrumb';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { RegionService } from 'src/app/core/services/bank/setup/region/region.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Region } from 'src/app/core/models/bank/setup/region';
import { RegionTable } from 'src/app/core/enums/bank/setup/region-table';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { Observable, of } from 'rxjs';
import { Country } from 'src/app/core/models/bank/setup/country';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-region-list',
  templateUrl: './region-list.component.html',
  styleUrls: ['./region-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    ReactiveFormsModule,
    LoaderInfiniteSpinnerComponent,
    RemoveItemDialogComponent,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
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
export class RegionListComponent implements OnInit {
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public tableFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public RegionTable: typeof RegionTable = RegionTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private tr: TranslocoService,
    private regionService: RegionService,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Region>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: Region, filter: string) => {
      return data.Country_Name &&
        data.Country_Name.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        )
        ? true
        : false ||
          (data.Region_Name &&
            data.Region_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseRegionListResponse(result: HttpDataResponse<number | Region[]>) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Region[]);
    }
  }
  private requestRegionList() {
    this.tableLoading = true;
    this.regionService
      .getAllRegionsList({})
      .then((result) => {
        this.parseRegionListResponse(result);
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
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 5;
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`regionDialog.regionsTable`, {}, this.scope)
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
  private switchDeleteRegionErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      default:
        return this.tr.translate(`setup.regionDialog.failedToDeleteRegion`);
    }
  }
  private parseDeleteRegionResponse(result: HttpDataResponse<number>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchDeleteRegionErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let message = this.tr.translate(
        `setup.regionDialog.removeRegionSuccessfully`
      );
      AppUtilities.showSuccessMessage(
        message,
        (e) => {},
        this.tr.translate('actions.ok')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.Region_SNO === result.response);
      this.tableDataService.removedData(index);
    }
  }
  private requestDeleteRegion(body: { sno: number; userid: number }) {
    this.startLoading = true;
    this.regionService
      .deleteRegion(body)
      .then((result) => {
        this.parseDeleteRegionResponse(result);
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
    this.requestRegionList();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Country_Name':
      case 'Region_Name':
      case 'District_Status':
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
      case 'Region_Name':
        return `${style} text-black font-semibold`;
      case 'Region_Status':
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
  openAddRegionDialog() {
    let dialogRef = this.dialog.open(RegionDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        region: null,
      },
    });
    dialogRef.componentInstance.addedRegion
      .asObservable()
      .subscribe((region) => {
        dialogRef.close();
        this.tableDataService.addedData(region);
        //this.requestRegionList();
      });
  }
  openEditRegionDialog(region: Region) {
    let dialogRef = this.dialog.open(RegionDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        region: region,
      },
    });
    dialogRef.componentInstance.addedRegion
      .asObservable()
      .subscribe((region) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex((item) => item.Region_SNO === region.Region_SNO);
        this.tableDataService.editedData(region, index);
      });
  }
  openRemoveDialog(region: Region, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.regionDialog.removeRegion`);
    dialog.message = this.tr.translate(`setup.regionDialog.sureRemoveRegion`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: region.Region_SNO,
        userid: this.getUserProfile().Usno,
      };
      this.requestDeleteRegion(data);
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
    return this.tableFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
