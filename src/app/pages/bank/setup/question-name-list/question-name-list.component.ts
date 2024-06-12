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
import { TimeoutError } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { QuestionNameDialogComponent } from 'src/app/components/dialogs/bank/setup/question-name-dialog/question-name-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { QuestionNameTable } from 'src/app/core/enums/bank/setup/question-name-table';
import { QuestionName } from 'src/app/core/models/bank/setup/question-name';
import { QuestionNameService } from 'src/app/core/services/bank/setup/question-name/question-name.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-question-name-list',
  templateUrl: './question-name-list.component.html',
  styleUrls: ['./question-name-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
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
export class QuestionNameListComponent implements OnInit {
  public tableHeadersFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public QuestionNameTable: typeof QuestionNameTable = QuestionNameTable;
  public questionNamesData: QuestionName[] = [];
  public questionNames: QuestionName[] = [];
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private questionNameService: QuestionNameService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private requestQuestionNamesList() {
    this.tableLoading = true;
    this.questionNameService
      .getQuestionNameList({})
      .then((results) => {
        this.questionNamesData = results.response;
        this.questionNames = this.questionNamesData;
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
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `questionName.questionNamesTable`,
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
      case this.QuestionNameTable.Q_NAME:
        this.questionNames.sort((a, b) =>
          a.Q_Name.toLocaleLowerCase() > b.Q_Name.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.QuestionNameTable.Q_STATUS:
        this.questionNames.sort((a, b) =>
          a?.Q_Status?.toLocaleLowerCase() > b?.Q_Status?.toLocaleLowerCase()
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
      case this.QuestionNameTable.Q_NAME:
        this.questionNames.sort((a, b) =>
          a.Q_Name.toLocaleLowerCase() < b.Q_Name.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case this.QuestionNameTable.Q_STATUS:
        this.questionNames.sort((a, b) =>
          a?.Q_Status?.toLocaleLowerCase() < b?.Q_Status?.toLocaleLowerCase()
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
      this.questionNames = this.questionNamesData.filter((questionName) => {
        return questionName.Q_Name.toLocaleLowerCase().includes(text);
      });
    } else {
      this.questionNames = this.questionNamesData;
    }
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.requestQuestionNamesList();
  }
  openQuestionNameDialog() {
    let dialogRef = this.dialog.open(QuestionNameDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        questionName: null,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestQuestionNamesList();
    });
  }
  editQuestionNameDialog(questionName: QuestionName) {
    let dialogRef = this.dialog.open(QuestionNameDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        questionName: questionName,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestQuestionNamesList();
    });
  }
  openRemoveQuestioNameDialog(
    questionName: QuestionName,
    dialog: RemoveItemDialogComponent
  ) {
    dialog.title = this.tr.translate(
      `setup.questionName.form.dialog.removeQuestion`
    );
    dialog.message = this.tr.translate(
      `setup.questionName.form.dialog.sureRemoveQuestion`
    );
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      alert('Delete question');
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
