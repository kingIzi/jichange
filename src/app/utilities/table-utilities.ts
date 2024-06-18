import { FormArray, FormBuilder } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { TableColumnsData } from '../core/models/table-columns-data';

export class TableUtilities {
  // static createTableColumns(tr: TranslocoService,
  //   translatePath: string,
  //   scope: any,
  //   headers: FormArray,
  //   fb: FormBuilder,
  //   nItems: number = 5,
  //   hideFirstColumn: boolean = false) {
  //     tr.selectTranslate(translatePath, {}, scope).subscribe((labels:string[]) => {
  //       labels.forEach((label,index) => {
  //         let col = fb.group({
  //           included: fb.control(hideFirstColumn && index == 0 ? false : index < nItems, []),
  //           label: fb.control(label, []),
  //         });
  //         if (col.get(`included`)?.value === true) {
  //           this.tableColumns.push(label);
  //         }
  //       })
  //     });
  // }
  // static createTableColumns(tr: TranslocoService,path:string,scope:any,originalTableColumns:TableColumnsData[],fb: FormBuilder,showing:number) {
  //   tr
  //     .selectTranslate(path, {}, scope)
  //     .subscribe((labels: TableColumnsData[]) => {
  //       originalTableColumns = labels;
  //       originalTableColumns.forEach((column, index) => {
  //         let col = fb.group({
  //           included: fb.control(
  //             index === 0
  //               ? false
  //               : index < showing || index === labels.length - 1,
  //             []
  //           ),
  //           label: fb.control(column.label, []),
  //           value: fb.control(column.value, []),
  //         });
  //         col.get(`included`)?.valueChanges.subscribe((included) => {
  //           this.resetTableColumns();
  //         });
  //         if (index === labels.length - 1) {
  //           col.disable();
  //         }
  //         this.headers.push(col);
  //       });
  //       this.resetTableColumns();
  //     });
  // }
  static createHeaders(
    tr: TranslocoService,
    translatePath: string,
    scope: any,
    headers: FormArray,
    fb: FormBuilder,
    tableComponent: any,
    nItems: number = 5,
    hideFirstColumn: boolean = false
  ) {
    tr.selectTranslate(translatePath, {}, scope).subscribe(
      (labels: string[]) => {
        labels.forEach((label, index) => {
          let header = fb.group({
            label: fb.control(label, []),
            sortAsc: fb.control(false, []),
            included: fb.control(
              hideFirstColumn && index == 0 ? false : index < nItems,
              []
            ),
            values: fb.array([], []),
          });
          header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
            if (value === true) {
              tableComponent.sortTableAsc(index);
            } else {
              tableComponent.sortTableDesc(index);
            }
          });
          headers.push(header);
        });
      }
    );
  }
}
