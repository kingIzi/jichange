import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
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
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Branch } from 'src/app/core/models/bank/branch';
import { Statuses } from 'src/app/core/models/status';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { timer } from 'rxjs';

@Component({
  selector: 'app-branch-list',
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    LoaderRainbowComponent,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
    RemoveItemDialogComponent,
    SuccessMessageBoxComponent,
  ],
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
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public branches: Branch[] = [];
  public branchHeadersForm!: FormGroup;
  public headersMap = {
    SNO: 0,
    BRANCH: 1,
    LOCATION: 2,
    STATUS: 3,
  };
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('diplayMessageBox') diplayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('alertMsg') alertMsg!: ElementRef;
  constructor(
    private dialog: MatDialog,
    private client: RequestClientService,
    private translocoService: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private getBranchList() {
    this.startLoading = true;
    this.client.performPost(`/api/Branch/GetBranchLists`, {}).subscribe({
      next: (result: any) => {
        this.startLoading = false;
        this.branches = result.response as Branch[];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.startLoading = false;
        AppUtilities.openDisplayMessageBox(
          this.diplayMessageBox,
          this.translocoService.translate(`errors.errorOccured`),
          this.translocoService.translate(`errors.verifyConnection`)
        );
        throw err;
      },
    });
  }
  private createFormHeaders() {
    this.branchHeadersForm = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.translocoService
      .selectTranslate(`branch.branchesTable`, {}, this.scope)
      .subscribe((labels: string[]) => {
        if (labels && labels.length > 0) {
          labels.forEach((label, index) => {
            if (index !== 0) {
              let header = this.fb.group({
                label: this.fb.control(label, []),
                search: this.fb.control('', []),
                sortAsc: this.fb.control('', []),
                values: this.fb.array([], []),
              });
              header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
                if (value === true) {
                  this.sortTableAsc(index);
                } else {
                  this.sortTableDesc(index);
                }
              });
              this.headers.push(header);
            }
          });
        }
      });
  }
  private removeBranch(sno: number) {
    this.startLoading = true;
    this.client
      .performPost(`/api/Branch/DeleteBranch?sno=${sno}`, {})
      .subscribe({
        next: (result) => {
          this.successMessageBox.title = this.translocoService.translate(
            `setup.branch.form.dialog.removedSuccessfully`
          );
          let dialog = this.successMessageBox.openDialog();
          timer(2000).subscribe(() => {
            this.getBranchList();
            dialog.close();
          });
        },
        error: (err) => {
          AppUtilities.openDisplayMessageBox(
            this.diplayMessageBox,
            this.translocoService.translate(`errors.errorOccured`),
            this.translocoService.translate(`errors.verifyConnection`)
          );
          throw err;
        },
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
    });
    dialogRef.componentInstance.addedBranch
      .asObservable()
      .subscribe((value: Branch) => {
        this.getBranchList();
        dialogRef.close();
      });
  }
  openEditBranchForm(branch: Branch) {
    let dialogRef = this.dialog.open(BranchDialogComponent, {
      width: '600px',
      data: {
        branch: branch,
      },
    });
    dialogRef.componentInstance.addedBranch.asObservable().subscribe((id) => {
      this.getBranchList();
      this.successMessageBox.title = this.translocoService.translate(
        `setup.branch.form.dialog.updated`
      );
      let dialog = this.successMessageBox.openDialog();
      dialogRef.close();
      timer(2000).subscribe(() => {
        this.getBranchList();
        dialog.close();
      });
    });
  }
  openRemoveDialog(branch: Branch, dialog: RemoveItemDialogComponent) {
    dialog.title = this.translocoService.translate(
      `setup.branch.form.dialog.removeBranch`
    );
    dialog.message = this.translocoService.translate(
      `setup.branch.form.dialog.sureDelete`
    );
    dialog.openDialog();
    dialog.remove.asObservable().subscribe((e) => {
      this.removeBranch(branch.Sno);
    });
  }
  searchTable(searchText: string) {
    if (searchText) {
      this.branches = this.branches.filter((elem) => {
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
      this.getBranchList();
    }
  }
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
  getActiveStatusStyles(status: string) {
    return status.toLocaleLowerCase() === 'active'
      ? 'bg-green-100 text-green-600 px-4 py-1 rounded-lg shadow'
      : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow';
  }
  sortColumnClicked(index: number) {
    let sortAsc = this.headers.at(index).get('sortAsc');
    if (!sortAsc?.value) {
      this.sortTableDesc(index);
      sortAsc?.setValue(true);
    } else {
      this.sortTableAsc(index);
      sortAsc?.setValue(false);
    }
  }
  get headers() {
    return this.branchHeadersForm.get(`headers`) as FormArray;
  }
}
