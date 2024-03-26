import { CommonModule } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-table-pagination',
  templateUrl: './table-pagination.component.html',
  styleUrls: ['./table-pagination.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, MatPaginatorModule],
})
export class TablePaginationComponent {
  public itemsPerPage: number[] = [5, 10, 20];
  @Output() public itemPerPage: number = this.itemsPerPage[0];
  @Output() public pages: number[] = [1];
  @Input() public totalItems: number = 0;
  public currentPage: number = 1;
  public startAt: number = 1;
  public maxPages: number = Math.ceil(this.totalItems * this.itemPerPage);
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
  nextPage() {
    //this.pages.push(this.pages[this.pages.length - 1] + 1);
    if (this.currentPage < this.maxPages) {
      this.currentPage++;
      this.startAt = this.currentPage * this.totalItems;
    }
  }
  prevPage() {
    // if (this.pages.length > 1) {
    //   this.pages.pop();
    // }
  }
}
