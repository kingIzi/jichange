import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-language-setup',
  templateUrl: './language-setup.component.html',
  styleUrls: ['./language-setup.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslocoModule, NgxLoadingModule, MatDialogModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class LanguageSetupComponent implements OnInit {
  constructor() {}
  ngOnInit(): void {}
  public startLoading: boolean = false;
}
