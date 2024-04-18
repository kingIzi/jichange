import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { Company } from 'src/app/core/models/bank/company';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { Branch } from 'src/app/core/models/bank/branch';
import { Region } from 'src/app/core/models/bank/region';
import { Observable, catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { District } from 'src/app/core/models/bank/district';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AddCompany } from 'src/app/core/models/bank/forms/add-company';
import { Ward } from 'src/app/core/models/bank/ward';
import { LoginResponse } from 'src/app/core/models/login-response';
import { BranchService } from 'src/app/core/services/setup/branch.service';
import { RegionService } from 'src/app/core/services/setup/region.service';
import { DistrictService } from 'src/app/core/services/setup/district.service';
import { WardService } from 'src/app/core/services/setup/ward.service';
import { CompanyService } from 'src/app/core/services/bank/company/company.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

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
  public wards: Ward[] = [];
  public companySummaryForm!: FormGroup;
  public userProfile!: LoginResponse;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  public companyAddedSuccessfully = new EventEmitter<boolean>();
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  constructor(
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private client: RequestClientService,
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
  async ngOnInit() {
    this.prepareForm();
    this.parseUserProfile();
  }
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private async prepareEditForm(company: Company) {
    this.startLoading = true;
    let branchList = from(this.branchService.postBranchList({}));
    let regionsList = from(this.regionService.getRegionList());
    let regSno = company.RegId.toString();
    let districtList = from(
      this.districtService.postDistrictList({ Sno: regSno })
    );
    let wardSno = company.WardSno.toString();
    let wardList = from(this.wardService.postWardList(wardSno));
    let mergedRes = zip(branchList, regionsList, districtList, wardList);
    let res = await lastValueFrom(
      mergedRes.pipe(
        map((results) => {
          return results;
        }),
        catchError((err) => {
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        })
      )
    );
    let [branches, regions, districts, wards] = res as any;
    this.branches = branches.response === 0 ? [] : branches.response;
    this.regions = regions.response === 0 ? [] : regions.response;
    this.districts = districts.response === 0 ? [] : districts.response;
    this.wards = wards.response === 0 ? [] : wards.response;
    this.createEditForm(company);
    this.startLoading = false;
    this.cdr.detectChanges();
  }
  private async prepareCreateForm() {
    this.startLoading = true;
    let branchList = from(this.branchService.postBranchList({}));
    let regionsList = from(this.regionService.getRegionList());
    let mergedRes = zip(branchList, regionsList);
    let res = await lastValueFrom(
      mergedRes.pipe(
        map((results) => {
          return results;
        }),
        catchError((err) => {
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        })
      )
    );
    let [branches, regions] = res as any;
    this.branches = branches.response === 0 ? [] : branches.response;
    this.regions = regions.response === 0 ? [] : regions.response;
    this.createForm();
    this.startLoading = false;
    this.cdr.detectChanges();
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
      compsno: this.fb.control(company.CompSno.toString(), [
        Validators.required,
      ]),
      compname: this.fb.control(company.CompName, [Validators.required]),
      mob: this.fb.control(company.MobNo, [
        Validators.required,
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      branch: this.fb.control(
        this.branches.find((b) => b.Sno === company.Branch_Sno)?.Branch_Sno,
        [Validators.required]
      ),
      check_status: this.fb.control(company.Checker, [Validators.required]),
      fax: this.fb.control(company.FaxNo, []),
      pbox: this.fb.control(company.PostBox, []),
      addr: this.fb.control(company.Address, []),
      rsno: this.fb.control(
        this.regions
          .find((r) => {
            return r.Region_SNO === company.RegId;
          })
          ?.Region_SNO.toString(),
        [Validators.required]
      ),
      dsno: this.fb.control(
        this.districts
          .find((d) => {
            return d.SNO === company.DistSno;
          })
          ?.SNO.toString(),
        [Validators.required]
      ),
      wsno: this.fb.control(company.WardSno.toString(), [Validators.required]),
      tin: this.fb.control(company.TinNo, []),
      vat: this.fb.control(company.VatNo, []),
      dname: this.fb.control(company.DirectorName, []),
      telno: this.fb.control(company.TelNo, [
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      email: this.fb.control(company.Email, [Validators.email]),
      dummy: this.fb.control(true, [Validators.required]),
      details: this.fb.array(
        [this.fb.group({ AccountNo: this.fb.control(company.AccountNo, []) })],
        []
      ),
    });
    this.updateDistrictList();
    this.updateWardList();
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
          .postDistrictList({ Sno: RegSno })
          .then((results: any) => {
            let res = results as HttpDataResponse<District[]>;
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
              this.districts = res.response;
            }
            this.startLoading = false;
            this.cdr.detectChanges();
          })
          .catch((err) => {
            this.startLoading = false;
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
        this.wardService.postWardList(district.SNO.toString()).then((data) => {
          let res = data as HttpDataResponse<Ward[]>;
          if (typeof res.response === 'number') {
            this.wards = [];
            AppUtilities.openDisplayMessageBox(
              this.displayMessageBox,
              this.translocoService.translate(`defaults.warning`),
              this.translocoService.translate(
                `company.summary.companyForm.dialogs.noWardForDistrict`
              )
            );
          } else {
            this.wards = res.response;
          }
          this.startLoading = false;
          this.cdr.detectChanges();
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
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      branch: this.fb.control('', [Validators.required]),
      check_status: this.fb.control('', [Validators.required]),
      fax: this.fb.control('', []),
      pbox: this.fb.control('', []),
      addr: this.fb.control('', []),
      rsno: this.fb.control('', [Validators.required]),
      dsno: this.fb.control('', [Validators.required]),
      wsno: this.fb.control('', [Validators.required]),
      tin: this.fb.control('', []),
      vat: this.fb.control('', []),
      dname: this.fb.control('', []),
      telno: this.fb.control('', [
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      email: this.fb.control('', [Validators.email]),
      dummy: this.fb.control(true, [Validators.required]),
      details: this.fb.array([], []),
    });
    this.updateDistrictList();
    this.updateWardList();
    this.addBankDetail();
  }

  public addBankDetail(ind: number = -1) {
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
    if (this.details.length > 1) {
      this.details.removeAt(ind);
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
    if (this.compname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.customer`)
      );
    } else if (this.mob.invalid) {
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
    } else if (this.check_status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.makerChecker`)
      );
    } else if (this.fax.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.faxNo`)
      );
    } else if (this.vat.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.vatNo`)
      );
    } else if (this.pbox.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.postBoxNo`)
      );
    } else if (this.addr.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.address`)
      );
    } else if (this.rsno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.region`)
      );
    } else if (this.dsno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.district`)
      );
    } else if (this.wsno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.ward`)
      );
    } else if (this.tin.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.tinNo`)
      );
    } else if (this.dname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.directorName`)
      );
    } else if (this.telno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.telephoneNo`)
      );
    } else if (this.email.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.emailId`)
      );
    }
  }
  submitCompanySummary() {
    if (this.companySummaryForm.valid) {
      this.startLoading = true;
      let companyReq = this.companyService
        .addCompany(this.companySummaryForm.value as AddCompany)
        .then((company) => {
          this.startLoading = false;
          this.companyAddedSuccessfully.emit(true);
          this.cdr.detectChanges();
        })
        .catch((err) => {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.translocoService.translate(`errors.errorOccured`),
            this.translocoService.translate(
              `company.summary.companyForm.dialogs.failedToAddCompany`
            )
          );
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        });
    } else {
      this.companySummaryForm.markAllAsTouched();
      this.formErrors();
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
