import { AbstractControl, FormArray, FormControl } from '@angular/forms';

export class PerformanceUtils {
  static trackByIndex(index: number): number {
    return index;
  }
  static sortColumnClicked(ind: number, headers: FormArray) {
    let sortAsc = headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  static getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  static getIndexOfItem(items: any[], item: any) {
    let index = items.indexOf(item);
    return index + 1;
  }
  static getActiveStatusStyles(
    status: string,
    target: string,
    // includedBg: string = 'bg-green-100',
    // includedText: string = 'text-green-600',
    // excludedBg: string = 'bg-orange-100',
    // excludedText: string = 'text-orange-600'
    includedBg: string,
    includedText: string,
    excludedBg: string,
    excludedText: string
  ) {
    return status?.toLocaleLowerCase() === target?.toLocaleLowerCase()
      ? `${includedBg} ${includedText} px-4 py-1 rounded-lg shadow-sm`
      : `${excludedBg} ${excludedText} px-4 py-1 rounded-lg shadow-sm`;
  }
  static convertDateStringToDate(date: string) {
    return new Date(date);
  }
  static moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  static convertDotNetJSONDate(dotNetJSONDate: string) {
    let timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp);
  }
  static formatToMobileNumberTZ(inputFeild: any, formControl: FormControl) {
    let DIGITS = 3;
    let text = inputFeild.target.value;
    let cleaned = text.replace(/\D/g, '');

    // Limit to 9 digits
    if (cleaned.length > DIGITS ** 2) {
      cleaned = cleaned.substring(0, DIGITS ** 2);
    }

    // Format the string to the desired pattern as the user types
    let parts = [];
    if (cleaned.length > 0) {
      parts.push(cleaned.slice(0, DIGITS));
    }
    if (cleaned.length > DIGITS) {
      parts.push(cleaned.slice(DIGITS, DIGITS * 2));
    }
    if (cleaned.length > DIGITS * 2) {
      parts.push(cleaned.slice(DIGITS * 2, DIGITS ** 2));
    }

    let formatted = parts.join(' - ');
    formControl.setValue(formatted);
  }

  static setPhoneNumberFormControl(
    prefix: string,
    value: string,
    formControl: FormControl
  ) {
    // if (text.length === 9) {
    //   let mobile = prefix.substring(1) + text;
    //   formControl.setValue(mobile);
    // }
    if (!value.startsWith(prefix.substring(1)) && value.length === 9) {
      formControl.setValue(prefix.substring(1) + value);
    } else if (value.startsWith('0') && value.length === 10) {
      formControl.setValue(prefix.substring(1) + value.substring(1));
    }
  }

  static formatToMobileNumber(text: string, formControl: FormControl) {
    let prefix = ' - ';
    let cleaned = text.replace(/\D/g, '');
    let parts = this.formatPhoneNumber(cleaned);
    let formatted = parts.join(prefix);
    formControl.setValue(formatted);
    if (formControl.valid) {
      parts.unshift('255');
      formControl.setValue(parts.join(''));
      //this.mobileNumber.setValue(parts.join(''));
    }
  }

  static formatPhoneNumber(cleaned: string) {
    let DIGITS = 3;

    let parts: string[] = [];
    if (!cleaned) return parts;

    if (cleaned.length > DIGITS ** 2) {
      cleaned = cleaned.substring(0, DIGITS ** 2);
    }

    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    if (cleaned.length > 0) {
      parts.push(cleaned.slice(0, DIGITS));
    }
    if (cleaned.length > DIGITS) {
      parts.push(cleaned.slice(DIGITS, DIGITS * 2));
    }
    if (cleaned.length > DIGITS * 2) {
      parts.push(cleaned.slice(DIGITS * 2, DIGITS ** 2));
    }
    return parts;
  }
}
