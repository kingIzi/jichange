import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loader-infinite-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loader-infinite-spinner.component.html',
  styleUrl: './loader-infinite-spinner.component.scss',
})
export class LoaderInfiniteSpinnerComponent implements AfterViewInit {
  @Input() show: boolean = false;
  ngAfterViewInit(): void {
    //console.log(this.spinner);
  }
}
