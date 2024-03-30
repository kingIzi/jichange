import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageSelectorComponent } from '../../language-selector/language-selector.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-vendor-header',
  templateUrl: './vendor-header.component.html',
  styleUrls: ['./vendor-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LanguageSelectorComponent,
    TranslocoModule,
    ReactiveFormsModule,
  ],
})
export class VendorHeaderComponent implements OnInit {
  public routeLoading: boolean = false;
  public formGroup!: FormGroup;
  constructor(
    private translocoService: TranslocoService,
    private fb: FormBuilder
  ) {}
  ngOnInit(): void {
    this.createHeaders();
  }
  private switchRouterLinks(ind: number) {
    switch (ind) {
      case 0:
        return '/vendor/customers';
      case 1:
        return '/vendor/invoice';
      case 2:
        return '/vendor/generated';
      default:
        return '/vendor';
    }
  }
  private createHeaders() {
    this.formGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.translocoService
      .selectTranslate('vendorHeaders')
      .subscribe((headers: any[]) => {
        headers.forEach((header, index) => {
          let group = this.fb.group({
            label: this.fb.control(header.name, []),
            dropdowns: this.fb.array([], []),
            rootLink: this.fb.control(this.switchRouterLinks(index), []),
          });
          this.headers.push(group);
        });
      });
  }
  get headers() {
    return this.formGroup.get('headers') as FormArray;
  }
}
