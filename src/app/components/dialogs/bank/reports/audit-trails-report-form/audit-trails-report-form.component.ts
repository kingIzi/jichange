import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  NO_ERRORS_SCHEMA,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { zip } from 'rxjs';
import { AuditTrailsReportForm } from 'src/app/core/models/bank/forms/reports/audit-trails-report-form';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { AuditTrailsService } from 'src/app/core/services/bank/reports/audit-trails/audit-trails.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { LoaderInfiniteSpinnerComponent } from '../../../../../reusables/loader-infinite-spinner/loader-infinite-spinner.component';

@Component({
  selector: 'app-audit-trails-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslocoModule,
    LoaderInfiniteSpinnerComponent,
  ],
  templateUrl: './audit-trails-report-form.component.html',
  styleUrl: './audit-trails-report-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [NO_ERRORS_SCHEMA],
})
export class AuditTrailsReportFormComponent implements OnInit {
  public selectPageOptions: string[] = [];
  public actions: string[] = [];
  public formGroup!: FormGroup;
  public startLoading: boolean = false;
  public AppUtilities: typeof AppUtilities = AppUtilities;
  @Output() public auditTrailForm = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private appConfig: AppConfigService,
    private auditTrailsService: AuditTrailsService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef
  ) {}
  private createForm() {
    this.formGroup = this.fb.group({
      tbname: this.fb.control<string>('', []),
      Startdate: this.fb.control<string>('', []),
      Enddate: this.fb.control<string>('', []),
      act: this.fb.control<string>('', []),
      branch: this.fb.control<number>(Number(this.getUserProfile().braid), []),
      userid: this.fb.control<number>(this.getUserProfile().Usno, []),
    });
    if (Number(this.getUserProfile().braid) > 0) {
      this.branch.disable();
    }
  }
  private buildPage() {
    let capitalize = (word: string) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    let auditPages = this.auditTrailsService.getTableNames({
      userid: this.getUserProfile().Usno,
    });
    let auditTypes = this.auditTrailsService.getAuditTypes({
      userid: this.getUserProfile().Usno,
    });
    let res = zip(auditPages, auditTypes);
    res.subscribe({
      next: (results) => {
        let [pages, types] = results;
        if (!AppUtilities.hasErrorResult(pages)) {
          this.selectPageOptions = pages.response as string[];
        }
        if (!AppUtilities.hasErrorResult(types)) {
          this.actions = types.response as string[];
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
  }
  ngOnInit(): void {
    this.buildPage();
    this.createForm();
  }
  getDateFromDatePickerFormControl(control: FormControl) {
    let t = new Date(control.value);
    return t;
  }
  getFormData() {
    let form = { ...this.formGroup.value };
    if (form.Startdate) {
      let startDate = new Date(form.Startdate);
      startDate.setHours(0, 0, 0, 0);
      form.Startdate = startDate.toISOString();
    }
    if (form.Enddate) {
      let endDate = new Date(form.Enddate);
      endDate.setHours(23, 59, 59, 999);
      form.Enddate = endDate.toISOString();
    }
    form.branch = this.branch.value;
    return form;
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse();
  }
  submitFilter() {
    if (this.formGroup.valid) {
      let form = this.getFormData();
      this.auditTrailForm.emit(form);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get tbname() {
    return this.formGroup.get('tbname') as FormControl;
  }
  get Startdate() {
    return this.formGroup.get('Startdate') as FormControl;
  }
  get Enddate() {
    return this.formGroup.get('Enddate') as FormControl;
  }
  get act() {
    return this.formGroup.get('act') as FormControl;
  }
  get branch() {
    return this.formGroup.get('branch') as FormControl;
  }
  get userid() {
    return this.formGroup.get('userid') as FormControl;
  }
}
