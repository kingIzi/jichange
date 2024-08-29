import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Observable, TimeoutError, from, of, zip } from 'rxjs';
import { CompanyUsersDialogComponent } from 'src/app/components/dialogs/Vendors/company-users-dialog/company-users-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { CompanyUsersTable } from 'src/app/core/enums/vendor/company/company-users-table';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { CompanyUser } from 'src/app/core/models/vendors/company-user';
import { RoleAct } from 'src/app/core/models/vendors/role-act';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { CompanyUserService } from 'src/app/core/services/vendor/company-user.service';
import { VENDOR_TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-company-users',
  standalone: true,
  imports: [
    MatPaginatorModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    TranslocoModule,
    MatDialogModule,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './company-users.component.html',
  styleUrl: './company-users.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/company', alias: 'company' },
    },
    {
      provide: VENDOR_TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class CompanyUsersComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public headersFormGroup!: FormGroup;
  public roleActs: RoleAct[] = [];
  // public tableData: {
  //   companUsers: CompanyUser[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<CompanyUser>;
  // } = {
  //   companUsers: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<CompanyUser>([]),
  // };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private companyService: CompanyService,
    private companyUserService: CompanyUserService,
    @Inject(VENDOR_TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<CompanyUser>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<CompanyUser>(
  //     this.tableData.companUsers
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  // }
  private dataSourceFilter() {
    let filterPredicate = (data: CompanyUser, filter: string) => {
      return data.Username.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Fullname &&
          data.Fullname.toLocaleLowerCase().includes(
            filter.toLocaleLowerCase()
          ))
        ? true
        : false ||
          (data.Email &&
            data.Email.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseCompanyUsersDataList(
    result: HttpDataResponse<string | number | CompanyUser[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as CompanyUser[]);
    }
  }
  private assignCompanyUsersDataList(
    result: HttpDataResponse<string | number | CompanyUser[]>
  ) {
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.companUsers = result.response;
    // } else {
    //   this.tableData.companUsers = [];
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`company.noUsersFound`)
    //   );
    // }
    // this.prepareDataSource();
    this.parseCompanyUsersDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.tableLoading = false;
    this.cdr.detectChanges();
  }
  private requestCompanyUsers() {
    this.tableLoading = true;
    this.companyService
      .postCompanyUsersList({ compid: this.getUserProfile().InstID })
      .then((result) => {
        this.assignCompanyUsersDataList(result);
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
  private createHeadersFormGroup() {
    let TABLE_SHOWING = 6;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`companyTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
            let col = this.fb.group({
              included: this.fb.control(
                index === 0
                  ? false
                  : index < TABLE_SHOWING || index === labels.length - 1,
                []
              ),
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
    //this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private assignRolesAct(result: HttpDataResponse<number | RoleAct[]>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      this.roleActs = [];
      let message = this.tr.translate(
        `company.companyUsersForm.errors.dialog.noRoleActFound`
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        message
      );
    } else {
      this.roleActs = result.response as RoleAct[];
    }
  }
  private requestRolesAct() {
    let vendor = this.appConfig.getLoginResponse() as VendorLoginResponse;
    this.startLoading = true;
    this.companyUserService
      .requestRolesAct({ compid: vendor.InstID }) //permanently at 67
      .then((results) => {
        this.assignRolesAct(results);
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
      });
  }
  //returns a form control given a name
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  // private searchTable(searchText: string, paginator: MatPaginator) {
  //   this.tableData.dataSource.filter = searchText.trim().toLowerCase();
  //   if (this.tableData.dataSource.paginator) {
  //     this.tableData.dataSource.paginator.firstPage();
  //   }
  // }
  private buildPage() {
    let vendor = this.appConfig.getLoginResponse() as VendorLoginResponse;
    this.tableLoading = true;
    let roleActsObs = from(
      this.companyUserService.requestRolesAct({ compid: vendor.InstID })
    );
    let companyUsersObs = from(
      this.companyService.postCompanyUsersList({ compid: vendor.InstID })
    );
    let res = AppUtilities.pipedObservables(zip(roleActsObs, companyUsersObs));
    res
      .then((results) => {
        let [roleActs, companyUsers] = results;
        this.assignRolesAct(roleActs);
        this.assignCompanyUsersDataList(companyUsers);
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
  ngOnInit(): void {
    //this.requestRolesAct();
    this.createHeadersFormGroup();
    //this.requestCompanyUsers();
    this.buildPage();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Username':
      case 'Usertype':
      case 'Fullname':
      case 'Email':
      case 'Mobile':
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
      case 'Username':
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
      case 'Userpos':
        return element[key]
          ? this.roleActs.find((role) => role.Sno === Number(element[key]))
              ?.Description
          : '-';
      default:
        return element[key];
    }
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  openCompanyUsersDialog() {
    let dialogRef = this.dialog.open(CompanyUsersDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        companyUser: null,
      },
    });
    dialogRef.componentInstance.addedUser
      .asObservable()
      .subscribe((companyUser) => {
        dialogRef.close();
        this.tableDataService.addedData(companyUser);
        //this.requestCompanyUsers();
      });
  }
  openEditCompanyUserDialog(companyUser: CompanyUser) {
    let dialogRef = this.dialog.open(CompanyUsersDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        companyUserId: companyUser.CompuserSno,
      },
    });
    dialogRef.componentInstance.addedUser
      .asObservable()
      .subscribe((companyUser) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex(
            (item) => item.CompuserSno === companyUser.CompuserSno
          );
        this.tableDataService.editedData(companyUser, index);
        //this.requestCompanyUsers();
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
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get('tableSearch') as FormControl;
  }
}
