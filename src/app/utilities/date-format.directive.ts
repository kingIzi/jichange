import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
} from '@angular/core';

@Directive({
  selector: '[appDateFormat]',
  standalone: true,
})
export class DateFormatDirective implements AfterViewInit {
  constructor(private el: ElementRef<HTMLInputElement>) {}
  ngAfterViewInit(): void {
    console.log(this.el);
  }
  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    if (value) {
      //this.el.nativeElement.value = formattedValue || '';
    }
  }
}
