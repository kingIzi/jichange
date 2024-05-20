import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterModule, TranslocoModule, CommonModule],
})
export class AppComponent implements OnInit {
  @ViewChild('noInternetModal') noInternetModal!: ElementRef;
  @ViewChild('connectedModal') connectedModal!: ElementRef;
  constructor() {}
  private verifyInternet() {
    window.addEventListener('online', () => {
      (this.connectedModal.nativeElement as HTMLDialogElement).showModal();
    });
    window.addEventListener('offline', () => {
      (this.noInternetModal.nativeElement as HTMLDialogElement).showModal();
    });
  }
  ngOnInit(): void {
    this.verifyInternet();
  }
}
