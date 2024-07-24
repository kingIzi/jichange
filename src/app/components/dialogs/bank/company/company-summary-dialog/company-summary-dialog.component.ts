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
import { Company } from 'src/app/core/models/bank/company/company';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { Region } from 'src/app/core/models/bank/setup/region';
import {
  Observable,
  TimeoutError,
  catchError,
  from,
  lastValueFrom,
  map,
  zip,
} from 'rxjs';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { District } from 'src/app/core/models/bank/setup/district';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AddCompany } from 'src/app/core/models/bank/forms/company/summary/add-company';
import { Ward } from 'src/app/core/models/bank/setup/ward';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { RegionService } from 'src/app/core/services/bank/setup/region/region.service';
import { DistrictService } from 'src/app/core/services/bank/setup/district/district.service';
import { WardService } from 'src/app/core/services/bank/setup/ward/ward.service';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';

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
    PhoneNumberInputComponent,
    LoaderInfiniteSpinnerComponent,
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
  public wards: Ward[] = [];
  public companySummaryForm!: FormGroup;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddCompany', { static: true })
  confirmAddCompany!: ElementRef<HTMLDialogElement>;
  public companyAddedSuccessfully = new EventEmitter<void>();
  public openDialogFailed = new EventEmitter<any>();
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private branchService: BranchService,
    private regionService: RegionService,
    private districtService: DistrictService,
    private wardService: WardService,
    private companyService: CompanyService,
    private dialogRef: MatDialogRef<CompanySummaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { companyData: Company },
    @Inject(TRANSLOCO_SCOPE) private scope: any,
    private cdr: ChangeDetectorRef
  ) {}
  private async prepareEditForm(company: Company) {
    this.startLoading = true;
    let regSno = company.RegId ? company?.RegId.toString() : '0';
    let wardSno = company.WardSno ? company?.WardSno.toString() : '0';
    let branchList = from(this.branchService.postBranchList({}));
    let regionsList = from(this.regionService.getRegionList());
    let districtList = from(
      this.districtService.getDistrictByRegion({ Sno: regSno })
    );
    let wardList = from(this.wardService.postWardList(wardSno));
    let mergedRes = zip(branchList, regionsList, districtList, wardList);
    try {
      let results = await AppUtilities.pipedObservables(mergedRes);
      let [branches, regions, districts, wards] = results;
      if (
        typeof branches.response !== 'number' &&
        typeof branches.response !== 'string'
      ) {
        this.branches = branches.response;
      }
      if (
        typeof regions.response !== 'number' &&
        typeof regions.response !== 'string'
      ) {
        this.regions = regions.response;
      }
      if (
        typeof districts.response !== 'number' &&
        typeof districts.response !== 'string'
      ) {
        this.districts = districts.response;
      }
      if (
        typeof wards.response !== 'number' &&
        typeof wards.response !== 'string'
      ) {
        this.wards = wards.response;
      }
      this.createEditForm(company);
      this.startLoading = false;
      this.cdr.detectChanges();
    } catch (err) {
      AppUtilities.requestFailedCatchError(
        err,
        this.displayMessageBox,
        this.tr
      );
      this.startLoading = false;
      this.cdr.detectChanges();
      throw err;
    }
  }
  private async prepareCreateForm() {
    this.startLoading = true;
    let branchList = from(this.branchService.postBranchList({}));
    let regionsList = from(this.regionService.getRegionList());
    let mergedRes = zip(branchList, regionsList);
    try {
      let results = await AppUtilities.pipedObservables(mergedRes);
      let [branches, regions] = results;
      if (
        typeof branches.response !== 'number' &&
        typeof branches.response !== 'string'
      ) {
        this.branches = branches.response;
      }
      if (
        typeof regions.response !== 'number' &&
        typeof regions.response !== 'string'
      ) {
        this.regions = regions.response;
      }
      this.createForm();
      this.startLoading = false;
      this.cdr.detectChanges();
    } catch (err) {
      AppUtilities.requestFailedCatchError(
        err,
        this.displayMessageBox,
        this.tr
      );
      this.startLoading = false;
      this.cdr.detectChanges();
      throw err;
    }
  }
  private async prepareForm() {
    this.startLoading = true;
    if (this.data?.companyData) {
      await this.prepareEditForm(this.data?.companyData);
    } else {
      await this.prepareCreateForm();
    }
    this.updateDistrictList();
    this.updateWardList();
    this.startLoading = false;
    this.isReady = true;
    this.cdr.detectChanges();
  }
  private createEditForm(company: Company) {
    this.companySummaryForm = this.fb.group({
      compsno: this.fb.control(company.CompSno.toString(), [
        Validators.required,
      ]),
      compname: this.fb.control(company.CompName, [Validators.required]),
      mob: this.fb.control(company.MobNo, [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      branch: this.fb.control(company.Branch_Sno ?? '', [Validators.required]),
      check_status: this.fb.control(company.Checker, [Validators.required]),
      fax: this.fb.control(company.FaxNo, []),
      pbox: this.fb.control(company.PostBox, []),
      addr: this.fb.control(company.Address, [Validators.required]),
      rsno: this.fb.control(company.RegId ?? '', []),
      dsno: this.fb.control(company.DistSno ?? '', []),
      wsno: this.fb.control(company.WardSno ?? '', []),
      tin: this.fb.control(company.TinNo, [
        Validators.required,
        Validators.pattern(/^\d{9}$/),
      ]),
      vat: this.fb.control(company.VatNo, []),
      dname: this.fb.control(company.DirectorName, []),
      telno: this.fb.control(company.TelNo, [
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      email: this.fb.control(company.Email, []),
      dummy: this.fb.control(true, [Validators.required]),
      details: this.fb.array(
        [
          this.fb.group({
            AccountNo: this.fb.control(company.AccountNo, []),
          }),
        ],
        []
      ),
    });
    // this.updateDistrictList();
    // this.updateWardList();
    this.companySummaryForm.markAllAsTouched();
  }
  private updateDistrictList() {
    this.rsno.valueChanges.subscribe((value) => {
      let region = this.regions.find((r) => {
        return r.Region_SNO == value;
      });
      if (region) {
        let RegSno = region.Region_SNO.toString();
        this.startLoading = true;
        this.districtService
          .getDistrictByRegion({ Sno: RegSno })
          .then((results: any) => {
            let res = results as HttpDataResponse<District[]>;
            if (typeof res.response === 'number') {
              this.districts = [];
              AppUtilities.openDisplayMessageBox(
                this.displayMessageBox,
                this.tr.translate(`defaults.warning`),
                this.tr.translate(
                  `company.summary.companyForm.dialogs.noDistrictForRegion`
                )
              );
            } else {
              this.districts = res.response;
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
    });
  }
  private updateWardList() {
    this.dsno.valueChanges.subscribe((value) => {
      let district = this.districts.find((d) => {
        return d.SNO == value;
      });
      if (district) {
        this.startLoading = true;
        this.wardService
          .postWardList(district.SNO.toString())
          .then((data) => {
            let res = data as HttpDataResponse<Ward[]>;
            if (typeof res.response === 'number') {
              this.wards = [];
              AppUtilities.openDisplayMessageBox(
                this.displayMessageBox,
                this.tr.translate(`defaults.warning`),
                this.tr.translate(
                  `company.summary.companyForm.dialogs.noWardForDistrict`
                )
              );
            } else {
              this.wards = res.response;
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
    });
  }
  private createForm() {
    this.companySummaryForm = this.fb.group({
      compsno: this.fb.control('0', [Validators.required]),
      compname: this.fb.control('', [Validators.required]),
      mob: this.fb.control('', [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      branch: this.fb.control('', [Validators.required]),
      check_status: this.fb.control('', [Validators.required]),
      fax: this.fb.control('', []),
      pbox: this.fb.control('', []),
      addr: this.fb.control('', [Validators.required]),
      rsno: this.fb.control('', []),
      dsno: this.fb.control('', []),
      wsno: this.fb.control('', []),
      tin: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^\d{9}$/),
      ]),
      vat: this.fb.control('', []),
      dname: this.fb.control('', []),
      telno: this.fb.control('', [
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      email: this.fb.control('', []),
      dummy: this.fb.control(true, [Validators.required]),
      details: this.fb.array([], []),
    });
    // this.updateDistrictList();
    // this.updateWardList();
    this.addBankDetail();
  }
  private determineAddCompanyErrorMessage(message: string) {
    if (
      message.toLocaleLowerCase() ===
      'Email Address already Exist'.toLocaleLowerCase()
    ) {
      return this.tr.translate(
        `company.summary.companyForm.dialogs.emailAddressExists`
      );
    } else if (
      message.toLocaleLowerCase() ===
      'Mobile number already Exist'.toLocaleLowerCase()
    ) {
      return this.tr.translate(
        `company.summary.companyForm.dialogs.mobileNumberAlreadyExists`
      );
    } else {
      return this.tr.translate(
        `company.summary.companyForm.dialogs.failedToAddCompany`
      );
    }
  }
  private requestAddCompany(successMessage: string) {
    this.startLoading = true;
    this.companyService
      .addCompany(this.companySummaryForm.value as AddCompany)
      .then((result) => {
        if (
          typeof result.message === 'string' &&
          result.message.toLocaleLowerCase() === 'failed' &&
          typeof result.response === 'string'
        ) {
          let msg = this.determineAddCompanyErrorMessage(result.response);
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`errors.errorOccured`),
            msg
          );
        } else if (
          typeof result.message === 'string' &&
          result.message.toLocaleLowerCase() === 'success'
        ) {
          let msg = AppUtilities.sweetAlertSuccessMessage(successMessage);
          this.companyAddedSuccessfully.emit();
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
  ngOnInit() {
    this.prepareForm();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  addBankDetail(ind: number = -1) {
    let group = this.fb.group({
      AccountNo: this.fb.control('', []),
    });
    let MAX = 1000;
    if (ind > -1 && this.details.at(ind).valid && this.details.length < MAX) {
      this.details.insert(ind + 1, group);
    } else if (ind > -1 && this.details.at(ind).invalid) {
      this.details.at(ind).markAllAsTouched();
    } else if (this.details.length < MAX) {
      this.details.push(group);
    } else if (this.details.length === MAX) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`vendors.invoiceDetails.form.dialog.invalidForm`),
        this.tr
          .translate(`vendors.invoiceDetails.form.dialog.maximumItemDetails`)
          .replace('{}', MAX.toString())
      );
    }
  }
  removeBankDetail(ind: number) {
    if (this.details.length > 1) {
      this.details.removeAt(ind);
    }
  }
  closeDialog() {
    this.dialogRef.close('Vendor dialog closed');
  }
  submitCompanySummary() {
    if (this.companySummaryForm.valid) {
      this.confirmAddCompany.nativeElement.showModal();
    } else {
      this.companySummaryForm.markAllAsTouched();
    }
  }
  addCompany() {
    if (!this.data?.companyData) {
      console.log(this.companySummaryForm.value);
      this.confirmAddCompany.nativeElement.close();
      this.requestAddCompany(
        this.tr.translate(`company.summary.actions.addedCompanySuccessfully`)
      );
    } else {
      this.confirmAddCompany.nativeElement.close();
      this.requestAddCompany(
        this.tr.translate(`company.summary.actions.modifiedCompanySuccessfully`)
      );
    }
  }
  get compsno() {
    return this.companySummaryForm.get('compsno') as FormControl;
  }
  get compname() {
    return this.companySummaryForm.get('compname') as FormControl;
  }
  get mob() {
    return this.companySummaryForm.get('mob') as FormControl;
  }
  get branch() {
    return this.companySummaryForm.get('branch') as FormControl;
  }
  get check_status() {
    return this.companySummaryForm.get('check_status') as FormControl;
  }
  get fax() {
    return this.companySummaryForm.get('fax') as FormControl;
  }
  get pbox() {
    return this.companySummaryForm.get('pbox') as FormControl;
  }
  get addr() {
    return this.companySummaryForm.get('addr') as FormControl;
  }
  get rsno() {
    return this.companySummaryForm.get('rsno') as FormControl;
  }
  get dsno() {
    return this.companySummaryForm.get('dsno') as FormControl;
  }
  get wsno() {
    return this.companySummaryForm.get('wsno') as FormControl;
  }
  get tin() {
    return this.companySummaryForm.get('tin') as FormControl;
  }
  get vat() {
    return this.companySummaryForm.get('vat') as FormControl;
  }
  get dname() {
    return this.companySummaryForm.get('dname') as FormControl;
  }
  get telno() {
    return this.companySummaryForm.get('telno') as FormControl;
  }
  get email() {
    return this.companySummaryForm.get('email') as FormControl;
  }
  get details() {
    return this.companySummaryForm.get('details') as FormArray;
  }
}
