import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { LoginResponse } from 'src/app/core/models/login-response';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { AddBranchForm } from 'src/app/core/models/bank/forms/setup/branch/add-branch-form';

@Component({
  selector: 'app-branch-dialog',
  templateUrl: './branch-dialog.component.html',
  styleUrls: ['./branch-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    LoaderRainbowComponent,
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
export class BranchDialogComponent implements OnInit {
  public branchForm!: FormGroup;
  public startLoading: boolean = false;
  public addedBranch = new EventEmitter<void>();
  private userProfile = JSON.parse(
    localStorage.getItem('userProfile') as string
  ) as LoginResponse;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddBranch', { static: true })
  confirmAddBranch!: ElementRef<HTMLDialogElement>;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BranchDialogComponent>,
    private tr: TranslocoService,
    //private client: RequestClientService,
    private branchService: BranchService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      branch: Branch;
    }
  ) {}
  private formErrors(errorsPath: string = 'setup.branch.form.dialog') {
    if (this.Name.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingBranch`)
      );
    }
    if (this.Location.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingLocation`)
      );
    }
    if (this.Status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private createForm() {
    this.branchForm = this.fb.group({
      Name: this.fb.control('', [Validators.required]),
      Location: this.fb.control('', [Validators.required]),
      Status: this.fb.control('', [Validators.required]),
      AuditBy: this.fb.control(this.userProfile.Usno, [Validators.required]),
      Branch_Sno: this.fb.control(0, [Validators.required]),
    });
  }
  private createEditForm(branch: Branch) {
    this.branchForm = this.fb.group({
      Name: this.fb.control(branch.Name, [Validators.required]),
      Location: this.fb.control(branch.Location, [Validators.required]),
      Status: this.fb.control(branch.Status, [Validators.required]),
      AuditBy: this.fb.control(this.userProfile.Usno, [Validators.required]),
      Branch_Sno: this.fb.control(branch.Branch_Sno, [Validators.required]),
    });
  }
  private addNewBranch(body: AddBranchForm, successMessage: string) {
    this.startLoading = true;
    this.branchService
      .addBranch(body)
      .then((result) => {
        if (typeof result.response === 'number' && result.response > 0) {
          let sal = AppUtilities.sweetAlertSuccessMessage(successMessage);
          sal.then((res) => {
            this.addedBranch.emit();
          });
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.branch.form.dialog.failedToAddBranch`)
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
    if (this.data && this.data.branch) {
      this.createEditForm(this.data.branch);
    } else {
      this.createForm();
    }
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitBranchForm() {
    if (this.branchForm.valid) {
      this.confirmAddBranch.nativeElement.showModal();
    } else {
      this.branchForm.markAllAsTouched();
    }
  }
  addBranch() {
    if (!this.data?.branch) {
      this.addNewBranch(
        this.branchForm.value,
        this.tr.translate(`setup.branch.form.dialog.addedSuccessfully`)
      );
    } else {
      this.addNewBranch(
        this.branchForm.value,
        this.tr.translate(`setup.branch.form.dialog.updated`)
      );
    }
  }
  get Name() {
    return this.branchForm.get('Name') as FormControl;
  }
  get Location() {
    return this.branchForm.get('Location') as FormControl;
  }
  get Status() {
    return this.branchForm.get('Status') as FormControl;
  }
  get AuditBy() {
    return this.branchForm.get('AuditBy') as FormControl;
  }
}
