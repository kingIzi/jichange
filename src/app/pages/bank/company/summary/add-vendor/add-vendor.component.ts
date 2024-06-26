import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
import { ActivatedRoute } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import {
  Observable,
  filter,
  first,
  from,
  lastValueFrom,
  map,
  of,
  zip,
} from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { Company } from 'src/app/core/models/bank/company/company';
import { AddCompany } from 'src/app/core/models/bank/forms/company/summary/add-company';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { District } from 'src/app/core/models/bank/setup/district';
import { Region } from 'src/app/core/models/bank/setup/region';
import { Ward } from 'src/app/core/models/bank/setup/ward';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { DistrictService } from 'src/app/core/services/bank/setup/district/district.service';
import { RegionService } from 'src/app/core/services/bank/setup/region/region.service';
import { WardService } from 'src/app/core/services/bank/setup/ward/ward.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { Location } from '@angular/common';

@Component({
  selector: 'app-add-vendor',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    PhoneNumberInputComponent,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  templateUrl: './add-vendor.component.html',
  styleUrl: './add-vendor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
  animations: [
    trigger('inOutAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.2s ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class AddVendorComponent implements OnInit {
  public startLoading: boolean = false;
  public companySummaryForm!: FormGroup;
  public userProfile!: LoginResponse;
  public company!: Observable<Company>;
  public formData: {
    branches$: Observable<Branch[]>;
    regions$: Observable<Region[]>;
    districts$: Observable<District[]>;
    wards$: Observable<Ward[]>;
  } = {
    branches$: of([]),
    regions$: of([]),
    districts$: of([]),
    wards$: of([]),
  };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('companyNotFound') companyNotFound!: DisplayMessageBoxComponent;
  @ViewChild('confirmAddCompany', { static: true })
  confirmAddCompany!: ElementRef<HTMLDialogElement>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private branchService: BranchService,
    private regionService: RegionService,
    private districtService: DistrictService,
    private wardService: WardService,
    private companyService: CompanyService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private retrieveQueryParams() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params['Comp']) {
        let Comp = atob(params['Comp']);
        this.requestCompanyById({ Sno: Comp });
      }
    });
  }
  private async findByIdFromObservableList(
    observable$: Observable<any[]>,
    key: string,
    id: number
  ) {
    let found$ = observable$.pipe(
      map((dataList) => dataList.find((data: any) => data[key] === id)),
      filter((data) => !!data),
      first()
    );
    return await lastValueFrom(found$);
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
  private createForm() {
    this.companySummaryForm = this.fb.group({
      compsno: this.fb.control('0', [Validators.required]),
      compname: this.fb.control('', [Validators.required]),
      mob: this.fb.control('', [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
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
    this.addBankDetail();
    this.regionChanged();
    this.districtChanged();
  }
  private createEditForm(company: Company) {
    this.compsno.setValue(company.CompSno.toString());
    this.compname.setValue(company.CompName);
    this.mob.setValue(company.MobNo);
    this.branch.setValue(company.Branch_Sno);
    this.check_status.setValue(company.Checker);
    this.fax.setValue(company.FaxNo);
    this.pbox.setValue(company.PostBox);
    this.addr.setValue(company.Address);
    this.rsno.setValue(company.RegId);
    this.dsno.setValue(company.DistSno);
    this.wsno.setValue(company.WardSno);
    this.tin.setValue(company.TinNo);
    this.vat.setValue(company.VatNo);
    this.dname.setValue(company.DirectorName);
    this.telno.setValue(company.TelNo);
    this.email.setValue(company.Email);
    this.companySummaryForm.get('dummy')?.setValue(true);
    this.details.controls.at(0)?.get('AccountNo')?.setValue(company?.AccountNo);
  }
  private regionChanged() {
    this.rsno.valueChanges.subscribe((value) => {
      if (value) {
        this.requestDistrictsList({ Sno: value });
      }
    });
  }
  private districtChanged() {
    this.dsno.valueChanges.subscribe((value) => {
      if (value) {
        this.requestWardsList(value);
      }
    });
  }
  private getBuildPageRequests() {
    let branchesObs = from(this.branchService.postBranchList({}));
    let regionsObs = from(this.regionService.getAllRegionsList({}));
    let merged = zip(branchesObs, regionsObs);
    return merged;
  }
  private assignBranchesFormDataList(
    result: HttpDataResponse<string | number | Branch[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.formData.branches$ = of(result.response);
    } else {
      this.formData.branches$ = of([]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        this.tr.translate(`company.summary.companyForm.dialogs.noBranchesFound`)
      );
    }
  }
  private assignRegionsFormDataList(
    result: HttpDataResponse<string | number | Region[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.formData.regions$ = of(result.response);
    } else {
      this.formData.regions$ = of([]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        this.tr.translate(`company.summary.companyForm.dialogs.noRegionsFound`)
      );
    }
  }
  private async assignDistrictsFormDataList(
    result: HttpDataResponse<string | number | District[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.formData.districts$ = of(result.response);
    } else {
      this.formData.districts$ = of([]);
      let regionId = Number(this.rsno.value);
      let region = (await this.findByIdFromObservableList(
        this.formData.regions$,
        'Region_SNO',
        regionId
      )) as Region;
      if (region) {
        let message = this.tr.translate(
          `company.summary.companyForm.dialogs.noDistrictsFound`
        );
        message = message.replace('{}', region.Region_Name);
        AppUtilities.openDisplayMessageBox(
          this.displayMessageBox,
          this.tr.translate(`defaults.warning`),
          message
        );
      }
    }
  }
  private async assignWardsFormDataList(
    result: HttpDataResponse<string | number | Ward[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.formData.wards$ = of(result.response);
    } else {
      this.formData.wards$ = of([]);
      let districtId = Number(this.dsno.value);
      let district = (await this.findByIdFromObservableList(
        this.formData.districts$,
        'SNO',
        districtId
      )) as District;
      if (district) {
        let message = this.tr.translate(
          `company.summary.companyForm.dialogs.noWardsFound`
        );
        message = message.replace('{}', district.District_Name);
        AppUtilities.openDisplayMessageBox(
          this.displayMessageBox,
          this.tr.translate(`defaults.warning`),
          message
        );
      }
    }
  }
  private assignInsertCompanyResponse(
    result: HttpDataResponse<string | number>,
    message: string
  ) {
    if (
      result.message.toLocaleLowerCase() === 'failed' &&
      typeof result.response === 'string'
    ) {
      let msg = this.determineAddCompanyErrorMessage(result.response);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        msg
      );
    } else if (result.message.toLocaleLowerCase() === 'success') {
      let sal = AppUtilities.sweetAlertSuccessMessage(message);
      this.resetForm();
    }
  }
  private assignCompanyInfo(
    result: HttpDataResponse<string | number | Company>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number'
    ) {
      this.company = of(result.response);
      this.company.subscribe((company) => {
        this.createEditForm(company);
      });
    } else {
      let dialog = this.companyNotFound.displayMessageDialog.nativeElement;
      dialog.addEventListener('close', () => {
        this.location.back();
      });
      AppUtilities.openDisplayMessageBox(
        this.companyNotFound,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`company.summary.noVendorFound`)
      );
    }
  }
  private buildPage() {
    this.startLoading = true;
    let requests = this.getBuildPageRequests();
    let res = AppUtilities.pipedObservables(requests);
    res
      .then((results) => {
        let [branches, regions] = results;
        this.assignBranchesFormDataList(branches);
        this.assignRegionsFormDataList(regions);
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
  private requestDistrictsList(body: { Sno: string }) {
    this.startLoading = true;
    this.districtService
      .getDistrictByRegion(body)
      .then((result) => {
        this.assignDistrictsFormDataList(result);
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
  private requestWardsList(districtId: string) {
    this.startLoading = true;
    this.wardService
      .postWardList(districtId)
      .then((result) => {
        this.assignWardsFormDataList(result);
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
  private requestCompanyById(body: { Sno: number | string }) {
    this.startLoading = true;
    this.companyService
      .getCompanyById(body)
      .then((result) => {
        this.assignCompanyInfo(result);
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
    this.buildPage();
    this.createForm();
    this.retrieveQueryParams();
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
  resetForm() {
    if (this.company) {
      this.company.subscribe((company) => {
        this.createEditForm(company);
      });
    } else {
      this.createForm();
    }
  }
  submitCompanySummary() {
    if (this.companySummaryForm.valid) {
      this.confirmAddCompany.nativeElement.showModal();
    } else {
      this.companySummaryForm.markAllAsTouched();
    }
  }
  private requestInsertCompany(body: AddCompany, successMsg: string) {
    this.startLoading = true;
    this.companyService
      .addCompany(body)
      .then((result) => {
        this.assignInsertCompanyResponse(result, successMsg);
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
  addCompany() {
    let body = this.companySummaryForm.value;
    if (this.company) {
      let message = this.tr.translate(
        `company.summary.actions.modifiedCompanySuccessfully`
      );
      this.requestInsertCompany(body, message);
    } else {
      let message = this.tr.translate(
        `company.summary.actions.addedCompanySuccessfully`
      );
      this.requestInsertCompany(body, message);
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
