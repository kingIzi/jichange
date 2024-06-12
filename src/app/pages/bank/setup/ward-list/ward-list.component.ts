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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { WardDialogComponent } from 'src/app/components/dialogs/bank/setup/ward-dialog/ward-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { WardTable } from 'src/app/core/enums/bank/setup/ward-table';
import { RemoveWardForm } from 'src/app/core/models/bank/forms/setup/ward/RemoveWard';
import { Ward } from 'src/app/core/models/bank/setup/ward';
import { LoginResponse } from 'src/app/core/models/login-response';
import { WardService } from 'src/app/core/services/bank/setup/ward/ward.service';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class WardListComponent implements OnInit {
  public userProfile!: LoginResponse;
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  public wards: Ward[] = [];
  public wardsData: Ward[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public WardTable: typeof WardTable = WardTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private wardService: WardService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableHeaders() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `wardDialog.wardsTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private emptyWardList() {
    this.wardsData = [];
    this.wards = this.wardsData;
  }
  private requestWardList() {
    this.emptyWardList();
    this.tableLoading = true;
    this.wardService
      .getAllWardsList({})
      .then((result) => {
        if (
          result.response &&
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.wardsData = result.response;
          this.wards = this.wardsData;
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
  private requestDeleteRegion(body: RemoveWardForm) {
    this.startLoading = true;
    this.wardService
      .deleteWard(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response === 'number' &&
          result.response == body.sno
        ) {
          let msg = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate('setup.wardDialog.deletedWardSuccessfully')
          );
          this.requestWardList();
        }
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
  private sortTableAsc(ind: number) {
    switch (ind) {
      case WardTable.DISTRICT:
        this.wards.sort((a, b) =>
          a?.District_Name.toLocaleLowerCase() >
          b?.District_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case WardTable.WARD:
        this.wards.sort((a, b) =>
          a?.Ward_Name.toLocaleLowerCase() > b?.Ward_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case WardTable.STATUS:
        this.wards.sort((a, b) =>
          a?.Ward_Status.toLocaleLowerCase() >
          b?.Ward_Status.toLocaleLowerCase()
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
      case WardTable.DISTRICT:
        this.wards.sort((a, b) =>
          a?.District_Name.toLocaleLowerCase() <
          b?.District_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case WardTable.WARD:
        this.wards.sort((a, b) =>
          a?.Ward_Name.toLocaleLowerCase() < b?.Ward_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case WardTable.STATUS:
        this.wards.sort((a, b) =>
          a?.Ward_Status.toLocaleLowerCase() <
          b?.Ward_Status.toLocaleLowerCase()
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
      this.wards = this.wardsData.filter((ward) => {
        return (
          ward.District_Name?.toLocaleLowerCase().includes(text) ||
          ward.Ward_Name?.toLocaleLowerCase().includes(text)
        );
      });
    } else {
      this.wards = this.wardsData;
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeaders();
    this.requestWardList();
  }
  openWardForm() {
    let dialogRef = this.dialog.open(WardDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        ward: null,
      },
    });
    dialogRef.componentInstance.addedWard.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestWardList();
    });
  }
  openEditWardForm(ward: Ward) {
    let dialogRef = this.dialog.open(WardDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        ward: ward,
      },
    });
    dialogRef.componentInstance.addedWard.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestWardList();
    });
  }
  openRemoveDialog(ward: Ward, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.wardDialog.removeWard`);
    dialog.message = this.tr.translate(`setup.wardDialog.sureRemoveWard`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: ward.SNO,
        userid: this.userProfile.Usno,
      };
      this.requestDeleteRegion(data);
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
