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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TimeoutError } from 'rxjs';
import { CompanyUsersDialogComponent } from 'src/app/components/dialogs/Vendors/company-users-dialog/company-users-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { CompanyUsersTable } from 'src/app/core/enums/vendor/company/company-users-table';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CompanyUser } from 'src/app/core/models/vendors/company-user';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
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
  ],
  templateUrl: './company-users.component.html',
  styleUrl: './company-users.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/company', alias: 'company' },
    },
  ],
})
export class CompanyUsersComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public companUsers: CompanyUser[] = [];
  public companUsersData: CompanyUser[] = [];
  public headersFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public CompanyUsersTable: typeof CompanyUsersTable = CompanyUsersTable;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  // public headersMap = {
  //   USER_NAME: 0,
  //   USER_TYPE: 1,
  //   FULL_NAME: 2,
  //   EMAIL: 3,
  //   MOBILE_NUMBER: 3,
  // };
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private companyService: CompanyService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private requestCompanyUsers() {
    this.tableLoading = true;
    this.companyService
      .postCompanyUsersList({ compid: this.userProfile.InstID })
      .then((results) => {
        if (typeof results.response === 'string') {
        } else {
          this.companUsersData = results.response;
          this.companUsers = this.companUsersData;
        }
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
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      'companyTable',
      this.scope,
      this.headers,
      this.fb,
      this,
      6,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  //returns a form control given a name
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case CompanyUsersTable.USERNAME:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Username?.toLocaleLowerCase() > b?.Username?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanyUsersTable.USERTYPE:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Usertype?.toLocaleLowerCase() > b?.Usertype?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanyUsersTable.FULL_NAME:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Fullname?.toLocaleLowerCase() > b?.Fullname?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanyUsersTable.EMAIL:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Email?.toLocaleLowerCase() > b?.Email?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanyUsersTable.MOBILE_NUMBER:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Mobile?.toLocaleLowerCase() > b?.Mobile?.toLocaleLowerCase()
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
      case CompanyUsersTable.USERNAME:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Username?.toLocaleLowerCase() < b?.Username?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanyUsersTable.USERTYPE:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Usertype?.toLocaleLowerCase() < b?.Usertype?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanyUsersTable.FULL_NAME:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Fullname?.toLocaleLowerCase() < b?.Fullname?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CompanyUsersTable.EMAIL:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Email?.toLocaleLowerCase() < b?.Email?.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case CompanyUsersTable.MOBILE_NUMBER:
        this.companUsers.sort((a: CompanyUser, b: CompanyUser) =>
          a?.Mobile?.toLocaleLowerCase() < b?.Mobile?.toLocaleLowerCase()
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
      this.companUsers = this.companUsersData.filter((elem: CompanyUser) => {
        return (
          elem?.Username.toLocaleLowerCase().includes(text) ||
          elem?.Fullname.toLocaleLowerCase().includes(text) ||
          elem?.Email.toLocaleLowerCase().includes(text)
        );
      });
    } else {
      this.companUsers = this.companUsersData;
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeadersFormGroup();
    this.requestCompanyUsers();
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
    dialogRef.componentInstance.addedUser.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestCompanyUsers();
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
    dialogRef.componentInstance.addedUser.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestCompanyUsers();
    });
  }
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get('tableSearch') as FormControl;
  }
}
