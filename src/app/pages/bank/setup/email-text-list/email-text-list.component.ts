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
import { EmailTextDialogComponent } from 'src/app/components/dialogs/bank/setup/email-text-dialog/email-text-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { EmailTextTable } from 'src/app/core/enums/bank/setup/email-text-table';
import { RemoveEmailTextForm } from 'src/app/core/models/bank/forms/setup/email-text/remove-email-text-form';
import { EmailText } from 'src/app/core/models/bank/setup/email-text';
import { LoginResponse } from 'src/app/core/models/login-response';
import { EmailTextService } from 'src/app/core/services/bank/setup/email-text/email-text.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-email-text-list',
  templateUrl: './email-text-list.component.html',
  styleUrls: ['./email-text-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
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
export class EmailTextListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public emailtexts: EmailText[] = [];
  public emailtextsData: EmailText[] = [];
  public tableFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public EmailTextTable: typeof EmailTextTable = EmailTextTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private emailTextService: EmailTextService,
    @Inject(TRANSLOCO_SCOPE) public scope: any
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
      `emailText.emailTextsTable`,
      this.scope,
      this.headers,
      this.fb,
      this,
      3
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.toLocaleLowerCase();
      this.emailtexts = this.emailtextsData.filter((emailText) => {
        return (
          emailText.Email_Text.toLocaleLowerCase().includes(text) ||
          emailText.Local_Text.toLocaleLowerCase().includes(text) ||
          emailText.Subject.toLocaleLowerCase().includes(text) ||
          emailText.Local_subject.toLocaleLowerCase().includes(text)
        );
      });
    } else {
      this.emailtexts = this.emailtextsData;
    }
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case EmailTextTable.CREATED:
        this.emailtexts.sort((a, b) =>
          new Date(a?.Effective_Date).toLocaleDateString().toLocaleLowerCase() >
          new Date(b?.Effective_Date).toLocaleDateString().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmailTextTable.SUBJECT_ENGLISH:
        this.emailtexts.sort((a, b) =>
          a?.Subject.toLocaleLowerCase() > b?.Subject.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmailTextTable.EMAL_TEXT_ENGLISH:
        this.emailtexts.sort((a, b) =>
          a?.Email_Text.toLocaleLowerCase() > b?.Email_Text.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmailTextTable.SUBJECT_KISWAHILI:
        this.emailtexts.sort((a, b) =>
          a?.Local_subject.toLocaleLowerCase() >
          b?.Local_subject.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmailTextTable.EMAIL_TEXT_KISWAHILI:
        this.emailtexts.sort((a, b) =>
          a?.Local_Text.toLocaleLowerCase() > b?.Local_Text.toLocaleLowerCase()
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
      case EmailTextTable.CREATED:
        this.emailtexts.sort((a, b) =>
          new Date(a?.Effective_Date).toLocaleDateString().toLocaleLowerCase() <
          new Date(b?.Effective_Date).toLocaleDateString().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmailTextTable.SUBJECT_ENGLISH:
        this.emailtexts.sort((a, b) =>
          a?.Subject.toLocaleLowerCase() < b?.Subject.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmailTextTable.EMAL_TEXT_ENGLISH:
        this.emailtexts.sort((a, b) =>
          a?.Email_Text.toLocaleLowerCase() < b?.Email_Text.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmailTextTable.SUBJECT_KISWAHILI:
        this.emailtexts.sort((a, b) =>
          a?.Local_subject.toLocaleLowerCase() <
          b?.Local_subject.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case EmailTextTable.EMAIL_TEXT_KISWAHILI:
        this.emailtexts.sort((a, b) =>
          a?.Local_Text.toLocaleLowerCase() < b?.Local_Text.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private requestEmailTextList() {
    this.tableLoading = true;
    this.emailTextService
      .getAllEmailTextList({})
      .then((result) => {
        if (
          result.response &&
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.emailtextsData = result.response;
          this.emailtexts = this.emailtextsData;
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
  private requestRemoveEmailText(body: RemoveEmailTextForm) {
    this.startLoading = true;
    this.emailTextService
      .deleteEmailText(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response === 'number' &&
          result.response == body.sno
        ) {
          let m = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`setup.emailText.deletedEmailText`)
          );
          this.requestEmailTextList();
          // m.then((res) => {
          //   this.requestEmailTextList();
          // });
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.smtp.failedToRemoveSmtp`)
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
    this.createTableHeaders();
    this.requestEmailTextList();
  }
  openEmailTextForm() {
    let dialogRef = this.dialog.open(EmailTextDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        emailText: null,
      },
    });
    dialogRef.componentInstance.addedEmailText.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestEmailTextList();
    });
  }
  openEditEmailTextForm(emailText: EmailText) {
    let dialogRef = this.dialog.open(EmailTextDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        emailText: emailText,
      },
    });
    dialogRef.componentInstance.addedEmailText.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestEmailTextList();
    });
  }
  openRemoveDialog(emailText: EmailText, dialog: RemoveItemDialogComponent) {
    dialog.title = this.tr.translate(`setup.emailText.removeEmailText`);
    dialog.message = this.tr.translate(`setup.emailText.sureRemoveEmailText`);
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      let data = {
        sno: emailText.SNO,
        userid: this.userProfile.Usno,
      };
      this.requestRemoveEmailText(data);
    });
  }
  get headers() {
    return this.tableFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
