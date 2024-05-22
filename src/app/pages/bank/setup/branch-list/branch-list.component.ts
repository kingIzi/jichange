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
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { BranchDialogComponent } from 'src/app/components/dialogs/bank/setup/branch-dialog/branch-dialog.component';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { inOutAnimation, toggle } from 'src/app/pages/auth/auth-animations';
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
import { TimeoutError, timer } from 'rxjs';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
  animations: [toggle, inOutAnimation],
})
export class BranchListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public branches: Branch[] = [];
  public branchesData: Branch[] = [];
  public branchHeadersForm!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public headersMap = {
    SNO: 0,
    BRANCH: 1,
    LOCATION: 2,
    STATUS: 3,
  };
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private branchService: BranchService,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private getBranchList() {
    this.tableLoading = true;
    this.branchService
      .postBranchList({})
      .then((results: any) => {
        if (results.response instanceof Array) {
          this.branchesData = results.response as Branch[];
          this.branches = this.branchesData;
        } else {
          this.branchesData = [];
          this.branches = this.branchesData;
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
  private createFormHeaders() {
    this.branchHeadersForm = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `branch.branchesTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      this.branches = this.branchesData.filter((elem) => {
        return (
          elem.Name.toLocaleLowerCase().includes(
            searchText.toLocaleLowerCase()
          ) ||
          elem.Location.toLocaleLowerCase().includes(
            searchText.toLocaleLowerCase()
          ) ||
          elem.Status.toLocaleLowerCase().includes(
            searchText.toLocaleLowerCase()
          )
        );
      });
    } else {
      this.branches = this.branchesData;
    }
  }
  private removeBranch(sno: number) {
    this.tableLoading = true;
    this.branchService
      .removeBranch(sno)
      .then((results: any) => {
        this.tableLoading = false;
        this.successMessageBox.title = this.tr.translate(
          `setup.branch.form.dialog.removedSuccessfully`
        );
        let dialog = this.successMessageBox.openDialog();
        timer(2000).subscribe(() => {
          this.getBranchList();
          dialog.close();
          this.cdr.detectChanges();
        });
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
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case this.headersMap.BRANCH:
        this.branches.sort((a, b) =>
          a.Name.toLocaleLowerCase() > b.Name.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.LOCATION:
        this.branches.sort((a, b) =>
          a.Location.toLocaleLowerCase() > b.Location.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.STATUS:
        this.branches.sort((a, b) =>
          a.Status.toLocaleLowerCase() > b.Status.toLocaleLowerCase() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case this.headersMap.BRANCH:
        this.branches.sort((a, b) =>
          a.Name.toLocaleLowerCase() < b.Name.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.headersMap.LOCATION:
        this.branches.sort((a, b) =>
          a.Location.toLocaleLowerCase() < b.Location.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.STATUS:
        this.branches.sort((a, b) =>
          a.Status.toLocaleLowerCase() < b.Status.toLocaleLowerCase() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  ngOnInit(): void {
    this.createFormHeaders();
    this.getBranchList();
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
