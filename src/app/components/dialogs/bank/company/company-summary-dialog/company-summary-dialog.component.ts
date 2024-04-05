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
  Validators,
} from '@angular/forms';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Company } from 'src/app/core/models/bank/company';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { Branch } from 'src/app/core/models/bank/branch';
import { Region } from 'src/app/core/models/bank/region';
import { Observable, lastValueFrom } from 'rxjs';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { District } from 'src/app/core/models/bank/district';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';

@Component({
  selector: 'app-company-summary-dialog',
  templateUrl: './company-summary-dialog.component.html',
  styleUrls: ['./company-summary-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    DisplayMessageBoxComponent,
    LoaderRainbowComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
})
export class CompanySummaryDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public isReady: boolean = false;
  public branches: Branch[] = [];
  public regions: Region[] = [];
  public districts: District[] = [];
  public companySummaryForm!: FormGroup;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private client: RequestClientService,
    private dialogRef: MatDialogRef<CompanySummaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { companyData: Company },
    @Inject(TRANSLOCO_SCOPE) private scope: any,
    private cdr: ChangeDetectorRef
  ) {}
  async ngOnInit() {
    this.prepareForm();
  }
  private async prepareEditForm(company: Company) {
    let branchList = (await this.requestBranchList()) as HttpDataResponse<
      Branch[]
    >;
    this.branches = branchList.response;
    let regionsList = (await this.requestRegionList()) as HttpDataResponse<
      Region[]
    >;
    this.regions = regionsList.response;
    let districtList = (await this.requestDistrictList({
      Sno: company.RegId.toString(),
    })) as HttpDataResponse<District[]>;
    this.districts = districtList.response;
    this.createEditForm(company);
  }
  private async prepareCreateForm() {
    let branchList = (await this.requestBranchList()) as HttpDataResponse<
      Branch[]
    >;
    this.branches = branchList.response as Branch[];
    let regionsList = (await this.requestRegionList()) as HttpDataResponse<
      Region[]
    >;
    this.regions = regionsList.response as Region[];
    this.createForm();
  }
  private async prepareForm() {
    this.startLoading = true;
    if (this.data?.companyData) {
      await this.prepareEditForm(this.data?.companyData);
    } else {
      await this.prepareCreateForm();
    }
    this.startLoading = false;
    this.isReady = true;
    this.cdr.detectChanges();
  }
  private createEditForm(company: Company) {
    this.companySummaryForm = this.fb.group({
      company: this.fb.control(company.CompName, [Validators.required]),
      mobileNo: this.fb.control(company.MobNo, [
        Validators.required,
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      branch: this.fb.control(
        this.branches.find((b) => b.Sno === company.Branch_Sno)?.Name,
        []
      ),
      makerChecker: this.fb.control(company.Checker, []),
      faxNo: this.fb.control(company.FaxNo, []),
      poBox: this.fb.control(company.PostBox, []),
      address: this.fb.control(company.Address, []),
      region: this.fb.control(
        this.regions.find((r) => {
          return r.Region_SNO === company.RegId;
        })?.Region_Name,
        []
      ),
      district: this.fb.control(
        this.districts.find((d) => {
          return d.SNO === company.DistSno;
        })?.District_Name,
        []
      ),
      ward: this.fb.control(company.WardSno, []),
      tinNo: this.fb.control(company.TinNo, []),
      vatNumber: this.fb.control(company.VatNo, []),
      directorName: this.fb.control(company.DirectorName, []),
      telphoneNumber: this.fb.control(company.TelNo, [
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      emailId: this.fb.control(company.Email, [Validators.email]),
      bankDetails: this.fb.array([], []),
    });
    this.updateDistrictList();
    this.addBankDetail();
    this.companySummaryForm.markAllAsTouched();
  }
  private async requestBranchList() {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Branch/GetBranchLists`, {})
    );
    return data;
  }
  private async requestRegionList() {
    let data = await lastValueFrom(
      this.client.performGet(`/api/Company/GetRegionDetails`)
    );
    return data;
  }
  private async requestDistrictList(body: { Sno: string }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Company/GetDistDetails`, body)
    );
    return data;
  }
  private updateDistrictList() {
    this.region.valueChanges.subscribe((value) => {
      let region = this.regions.find((r) => {
        return r.Region_Name.toLocaleLowerCase() === value.toLocaleLowerCase();
      });
      if (region) {
        this.requestDistrictList({ Sno: region.Region_SNO.toString() }).then(
          (data: any) => {
            let res = data as HttpDataResponse<District[]>;
            if (typeof res.response === 'number') {
              this.districts = [];
              AppUtilities.openDisplayMessageBox(
                this.displayMessageBox,
                this.translocoService.translate(`defaults.warning`),
                this.translocoService.translate(
                  `company.summary.companyForm.dialogs.noDistrictForRegion`
                )
              );
            } else {
              this.districts = data.response;
            }
          }
        );
      }
    });
  }
  private createForm() {
    this.companySummaryForm = this.fb.group({
      company: this.fb.control('', [Validators.required]),
      mobileNo: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      branch: this.fb.control('', [Validators.required]),
      makerChecker: this.fb.control('', [Validators.required]),
      faxNo: this.fb.control('', []),
      poBox: this.fb.control('', []),
      address: this.fb.control('', []),
      region: this.fb.control('', []),
      district: this.fb.control('', []),
      ward: this.fb.control('', []),
      tinNo: this.fb.control('', []),
      vatNumber: this.fb.control('', []),
      directorName: this.fb.control('', []),
      telphoneNumber: this.fb.control('', [
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      emailId: this.fb.control('', [Validators.email]),
      bankDetails: this.fb.array([], []),
    });
    this.updateDistrictList();
    this.addBankDetail();
  }

  public addBankDetail(ind: number = -1) {
    let group = this.fb.group({
      accountNumber: this.fb.control('', []),
    });
    let MAX = 1000;
    if (
      ind > -1 &&
      this.bankDetails.at(ind).valid &&
      this.bankDetails.length < MAX
    ) {
      this.bankDetails.insert(ind + 1, group);
    } else if (ind > -1 && this.bankDetails.at(ind).invalid) {
      this.bankDetails.at(ind).markAllAsTouched();
    } else if (this.bankDetails.length < MAX) {
      this.bankDetails.push(group);
    } else if (this.bankDetails.length === MAX) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(
          `vendors.invoiceDetails.form.dialog.invalidForm`
        ),
        this.translocoService
          .translate(`vendors.invoiceDetails.form.dialog.maximumItemDetails`)
          .replace('{}', MAX.toString())
      );
    }
  }
  public removeBankDetail(ind: number) {
    if (this.bankDetails.length > 1) {
      this.bankDetails.removeAt(ind);
    }
  }
  public closeDialog() {
    this.dialogRef.close('Vendor dialog closed');
  }
  updatePhoneNumber(prefix: string, control: FormControl) {
    AppUtilities.mobileNumberFormat(prefix, control);
  }
  private formErrors(
    errorsPath: string = 'company.summary.companyForm.dialogs'
  ) {
    if (this.company.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.customer`)
      );
    } else if (this.mobileNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.mobileNo`)
      );
    } else if (this.branch.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.branch`)
      );
    } else if (this.makerChecker.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.makerChecker`)
      );
    } else if (this.faxNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.faxNo`)
      );
    } else if (this.vatNumber.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.vatNo`)
      );
    } else if (this.poBox.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.postBoxNo`)
      );
    } else if (this.address.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.address`)
      );
    } else if (this.region.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.region`)
      );
    } else if (this.district.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.district`)
      );
    } else if (this.ward.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.ward`)
      );
    } else if (this.tinNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.tinNo`)
      );
    } else if (this.directorName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.directorName`)
      );
    } else if (this.telphoneNumber.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.telephoneNo`)
      );
    } else if (this.emailId.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.emailId`)
      );
    }
  }

  submitCompanySummary() {
    if (this.companySummaryForm.valid) {
      //this.isLoading.emit(this.controlNumberFormGroup.value);
      console.log(this.companySummaryForm.value);
    }
    this.companySummaryForm.markAllAsTouched();
    this.formErrors();
  }

  get company() {
    return this.companySummaryForm.get('company') as FormControl;
  }
  get mobileNo() {
    return this.companySummaryForm.get('mobileNo') as FormControl;
  }
  get branch() {
    return this.companySummaryForm.get('branch') as FormControl;
  }
  get makerChecker() {
    return this.companySummaryForm.get('makerChecker') as FormControl;
  }
  get faxNo() {
    return this.companySummaryForm.get('faxNo') as FormControl;
  }
  get poBox() {
    return this.companySummaryForm.get('poBox') as FormControl;
  }
  get address() {
    return this.companySummaryForm.get('address') as FormControl;
  }
  get region() {
    return this.companySummaryForm.get('region') as FormControl;
  }
  get district() {
    return this.companySummaryForm.get('district') as FormControl;
  }
  get ward() {
    return this.companySummaryForm.get('ward') as FormControl;
  }
  get tinNo() {
    return this.companySummaryForm.get('tinNo') as FormControl;
  }
  get vatNumber() {
    return this.companySummaryForm.get('vatNumber') as FormControl;
  }
  get directorName() {
    return this.companySummaryForm.get('directorName') as FormControl;
  }
  get telphoneNumber() {
    return this.companySummaryForm.get('telphoneNumber') as FormControl;
  }
  get emailId() {
    return this.companySummaryForm.get('emailId') as FormControl;
  }
  get bankDetails() {
    return this.companySummaryForm.get('bankDetails') as FormArray;
  }
}
