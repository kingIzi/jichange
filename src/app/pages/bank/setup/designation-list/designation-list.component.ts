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
import { TimeoutError } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { RemoveDistrictForm } from 'src/app/core/models/bank/forms/setup/district/remove-district-form';
import { RemoveDesignationForm } from 'src/app/core/models/bank/forms/setup/designation/remove-designation-form';
import { LoginResponse } from 'src/app/core/models/login-response';

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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class DesignationListComponent implements OnInit {
  public userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public designations: Designation[] = [];
  public designationsData: Designation[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private designationService: DesignationService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `designation.designationsTable`,
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
      case 0:
        this.designations.sort((a, b) =>
          a.Desg_Name.toLocaleLowerCase() > b.Desg_Name.toLocaleLowerCase()
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
      case 0:
        this.designations.sort((a, b) =>
          a.Desg_Name.toLocaleLowerCase() < b.Desg_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private requestDesignationList() {
    //this.startLoading = true;
    this.tableLoading = true;
    this.designationService
      .getDesignationList()
      .then((results: any) => {
        this.designationsData = results.response === 0 ? [] : results.response;
        this.designations = this.designationsData;
        //this.startLoading = false;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      this.designations = this.designations.filter((elem) => {
        return elem.Desg_Name.toLocaleLowerCase().includes(
          searchText.toLocaleLowerCase()
        );
      });
    } else {
      this.requestDesignationList();
    }
  }
  private requestDeleteDesignation(body: RemoveDesignationForm) {
    this.startLoading = true;
    this.designationService
      .deleteDesignation(body)
      .then((result) => {
        if (
          typeof result.response === 'number' &&
          result.response == body.sno
        ) {
          let sal = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(
              `setup.designation.form.dialog.removedSuccessfully`
            )
          );
          sal.then((res) => {
            this.requestDesignationList();
          });
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate('defaults.failed'),
            this.tr.translate(
              `setup.designation.form.dialog.failedToAddDesignation`
            )
          );
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
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeadersFormGroup();
    this.requestDesignationList();
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  openDesignationDialog() {
    let dialogRef = this.dialog.open(DesignationDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        designationData: null,
      },
    });
    dialogRef.componentInstance.addedDesignation
      .asObservable()
      .subscribe(() => {
        dialogRef.close();
        this.requestDesignationList();
      });
  }
  openEditDesignationDialog(designation: Designation) {
    let dialogRef = this.dialog.open(DesignationDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        designationData: designation,
      },
    });
    dialogRef.componentInstance.addedDesignation
      .asObservable()
      .subscribe(() => {
        dialogRef.close();
        this.requestDesignationList();
      });
  }
  openRemoveDialog(
    designation: Designation,
    dialog: RemoveItemDialogComponent
  ) {
    dialog.title = this.tr.translate(
      `setup.designation.form.dialog.removeDesignation`
    );
    dialog.title = this.tr.translate(
      `setup.designation.form.dialog.sureDelete`
    );
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let body = {
        sno: designation.Desg_Id,
        userid: this.userProfile.Usno,
      };
      this.requestDeleteDesignation(body);
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
