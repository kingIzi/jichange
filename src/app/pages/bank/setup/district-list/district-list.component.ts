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
import { DistrictDialogComponent } from 'src/app/components/dialogs/bank/setup/district-dialog/district-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { DistrictTable } from 'src/app/core/enums/bank/setup/district-table';
import { RemoveDistrictForm } from 'src/app/core/models/bank/forms/setup/district/remove-district-form';
import { District } from 'src/app/core/models/bank/setup/district';
import { LoginResponse } from 'src/app/core/models/login-response';
import { DistrictService } from 'src/app/core/services/bank/setup/district/district.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-district-list',
  templateUrl: './district-list.component.html',
  styleUrls: ['./district-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    RemoveItemDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class DistrictListComponent implements OnInit {
  public userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public districts: District[] = [];
  public districtsData: District[] = [];
  public tableFormGroup!: FormGroup;
  public DistrictTable: typeof DistrictTable = DistrictTable;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private districtService: DistrictService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableHeaders() {
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `districtDialog.districtsTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private emptyDistrictList() {
    this.districtsData = [];
    this.districts = this.districtsData;
  }
  private requestDistrictList() {
    this.emptyDistrictList();
    this.tableLoading = true;
    this.districtService
      .getAllDistrictList({})
      .then((result) => {
        if (
          result.response &&
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.districtsData = result.response;
          this.districts = this.districtsData;
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
  private requestDeleteDistrict(body: RemoveDistrictForm) {
    this.startLoading = true;
    this.districtService
      .deleteDistrict(body)
      .then((result) => {
        if (
          result.message.toLocaleLowerCase() ==
          'Successfuly Deleted'.toLocaleLowerCase()
        ) {
          let msg = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(
              'setup.districtDialog.deletedDistrictSuccessfully'
            )
          );
          this.requestDistrictList();
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
      case DistrictTable.REGION:
        this.districts.sort((a, b) =>
          a.Region_Name.toLocaleLowerCase() > b.Region_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DistrictTable.DISTRICT:
        this.districts.sort((a, b) =>
          a.District_Name.toLocaleLowerCase() >
          b.District_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DistrictTable.STATUS:
        this.districts.sort((a, b) =>
          a.District_Status.toLocaleLowerCase() >
          b.District_Status.toLocaleLowerCase()
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
      case DistrictTable.REGION:
        this.districts.sort((a, b) =>
          a.Region_Name.toLocaleLowerCase() < b.Region_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DistrictTable.DISTRICT:
        this.districts.sort((a, b) =>
          a.District_Name.toLocaleLowerCase() <
          b.District_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DistrictTable.STATUS:
        this.districts.sort((a, b) =>
          a.District_Status.toLocaleLowerCase() <
          b.District_Status.toLocaleLowerCase()
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
      this.districts = this.districtsData.filter((district) => {
        return (
          district.Region_Name.toLocaleLowerCase().includes(text) ||
          district.District_Name.toLocaleLowerCase().includes(text)
        );
      });
    } else {
      this.districts = this.districtsData;
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeaders();
    this.requestDistrictList();
  }
  openDistrictForm() {
    let dialogRef = this.dialog.open(DistrictDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        district: null,
      },
    });
    dialogRef.componentInstance.addedDistrict.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestDistrictList();
    });
  }
  openEditDistrictDialog(district: District) {
    let dialogRef = this.dialog.open(DistrictDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        district: district,
      },
    });
    dialogRef.componentInstance.addedDistrict.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestDistrictList();
    });
  }
  openRemoveDialog(district: District, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.districtDialog.removeDistrict`);
    dialog.message = this.tr.translate(
      `setup.districtDialog.sureRemoveDistrict`
    );
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let body = {
        sno: district.SNO,
        userid: this.userProfile.Usno,
      } as RemoveDistrictForm;
      this.requestDeleteDistrict(body);
    });
  }
  get headers() {
    return this.tableFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
