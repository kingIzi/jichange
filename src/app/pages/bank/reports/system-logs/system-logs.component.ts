import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';

@Component({
  selector: 'app-system-logs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './system-logs.component.html',
  styleUrl: './system-logs.component.scss',
  imports: [
    TranslocoModule,
    CommonModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class SystemLogsComponent implements OnInit {
  public startLoading: boolean = false;
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  constructor(private location: Location) {}
  ngOnInit(): void {
    this.dialog.nativeElement.showModal();
    this.dialog.nativeElement.addEventListener('close', () => {
      this.location.back();
    });
  }
}
