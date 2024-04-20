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
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { DesignationService } from 'src/app/core/services/setup/designation.service';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Designation } from 'src/app/core/models/bank/designation';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { TimeoutError } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class DesignationListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public designations: Designation[] = [];
  public designationsData: Designation[] = [];
  public tableHeadersFormGroup!: FormGroup;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private designationService: DesignationService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.tr
      .selectTranslate('designation.designationsTable', {}, this.scope)
      .subscribe((labels: string[]) => {
        labels.forEach((label, index) => {
          let header = this.fb.group({
            label: this.fb.control(label, []),
            sortAsc: this.fb.control(false, []),
            included: this.fb.control(index < 5, []),
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
        });
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
        //this.startLoading = false;
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
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
    });
    dialogRef.afterClosed().subscribe((result) => {});
  }
  openEditDesignationDialog(designation: Designation) {
    let dialogRef = this.dialog.open(DesignationDialogComponent, {
      width: '600px',
      data: {
        designationData: designation,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {});
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
      console.log(`Item deleted`);
    });
  }
  searchTable(searchText: string) {
    if (searchText) {
      this.designations = this.designations.filter((elem) => {
        return elem.Desg_Name.toLocaleLowerCase().includes(
          searchText.toLocaleLowerCase()
        );
      });
    } else {
      this.requestDesignationList();
    }
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
}
