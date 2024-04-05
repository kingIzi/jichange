import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class FileHandlerService {
  private EXCEL_TYPE: string =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  private EXCEL_EXTENSION: string = '.xlsx';
  constructor() {}
  public downloadPdf(element: HTMLElement, filename: string) {
    let doc = new jsPDF(
      element.clientWidth > element.clientHeight ? 'l' : 'p',
      'mm',
      [element.clientWidth, element.clientHeight]
    );
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
  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: this.EXCEL_TYPE,
    });
    saveAs(data, fileName + '_exported' + this.EXCEL_EXTENSION);
  }
}
