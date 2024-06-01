import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

@Injectable({
  providedIn: 'root',
})
export class FileHandlerService {
  private EXCEL_TYPE: string =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  private EXCEL_EXTENSION: string = '.xlsx';
  private PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  constructor() {}
  public downloadPdf(
    element: HTMLElement,
    filename: string,
    width: number = 0,
    height: number = 0
  ) {
    let dim =
      width == 0 && height == 0
        ? element.clientWidth > element.clientHeight
        : width > height;
    let dimArr =
      width == 0 && height == 0
        ? [element.clientWidth, element.clientHeight]
        : [width, height];
    let doc = new jsPDF(dim ? 'l' : 'p', 'mm', dimArr);
    return doc.html(element, {
      callback: function (pdf: jsPDF) {
        //pdf.deletePage(pdf.getNumberOfPages());
        pdf.save(filename);
      },
    });
  }
  public downloadPdfRemoveLastPage(
    element: HTMLElement,
    filename: string,
    width: number = 0,
    height: number = 0
  ) {
    let dim =
      width == 0 && height == 0
        ? element.clientWidth > element.clientHeight
        : width > height;
    let dimArr =
      width == 0 && height == 0
        ? [element.clientWidth, element.clientHeight]
        : [width, height];
    let doc = new jsPDF(dim ? 'l' : 'p', 'mm', dimArr);
    return doc.html(element, {
      callback: function (pdf: jsPDF) {
        pdf.deletePage(pdf.getNumberOfPages());
        pdf.save(filename);
      },
    });
  }
  public exportAsExcelFile(json: any[], excelFileName: string): void {
    const myworksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const myworkbook: XLSX.WorkBook = {
      Sheets: { data: myworksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(myworkbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }
  public downloadExcelTable(
    data: any[],
    keys: string[],
    filename: string,
    dateKeys: string[]
  ) {
    let items: any[] = [];
    data.forEach((d: any) => {
      let item: any = {};
      keys.forEach((key) => {
        if (dateKeys.includes(key) && (d[key] != null || d[key] != '')) {
          item[key] = PerformanceUtils.convertDateStringToDate(d[key]);
        } else {
          item[key] = d[key];
        }
      });
      items.push(item);
    });
    this.exportAsExcelFile(items, filename);
  }
  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: this.EXCEL_TYPE,
    });
    saveAs(data, fileName + '_exported' + this.EXCEL_EXTENSION);
  }
}
