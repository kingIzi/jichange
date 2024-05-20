import { TranslocoService } from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../components/dialogs/success-message-box/success-message-box.component';
import { FormControl } from '@angular/forms';
import { SubmitMessageBoxComponent } from '../components/dialogs/submit-message-box/submit-message-box.component';
import { formatDate } from '@angular/common';
import { Observable, TimeoutError, catchError, lastValueFrom, map } from 'rxjs';
import Swal from 'sweetalert2';

export class AppUtilities {
  static phoneNumberPrefixRegex: any = /^(?:[67]\d{8}|255\d{9})$/;
  static openDisplayMessageBox(
    dialog: DisplayMessageBoxComponent,
    title: string,
    message: string
  ) {
    dialog.title = title;
    dialog.message = message;
    return dialog.openDialog();
  }

  static sweetAlertSuccessMessage(message: string) {
    return Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 3000,
    });
  }

  static openTimeoutError(
    dialog: DisplayMessageBoxComponent,
    tr: TranslocoService
  ) {
    dialog.title = tr.translate(`errors.errorOccured`);
    dialog.message = tr.translate(`errors.timeoutError`);
    return dialog.openDialog();
  }

  static openDialog(dialog: any, title: string, message: string) {
    dialog.title = title;
    dialog.message = message;
    return dialog.openDialog();
  }

  static openSubmitMessageBox(
    dialog: SubmitMessageBoxComponent,
    title: string,
    message: string
  ) {
    dialog.title = title;
    dialog.message = message;
    dialog.openDialog();
    return dialog;
  }

  static openSuccessMessageBox(
    dialog: SuccessMessageBoxComponent,
    title: string
  ) {
    dialog.title = title;
    return dialog.openDialog();
  }

  static noInternetError(
    dialog: DisplayMessageBoxComponent,
    transloco: TranslocoService
  ) {
    AppUtilities.openDisplayMessageBox(
      dialog,
      transloco.translate(`errors.errorOccured`),
      transloco.translate(`errors.verifyConnection`)
    );
  }

  static unexpectedErrorOccured(
    dialog: DisplayMessageBoxComponent,
    transloco: TranslocoService
  ) {
    AppUtilities.openDisplayMessageBox(
      dialog,
      transloco.translate(`errors.errorOccured`),
      transloco.translate(`errors.contactSupport`)
    );
  }

  static updatePhoneNumberPrefix(control: FormControl, prefix: string) {
    prefix = prefix.substring(1);
    if (control.value.startsWith('0')) {
      let value = control.value.substring(1);
      control.setValue(prefix + value);
    } else if (
      !control.value.startsWith('0') &&
      !control.value.startsWith('255') &&
      control.value.length === 9
    ) {
      control.setValue(prefix + control.value);
    }
  }

  static mobileNumberFormat(prefix: string, control: FormControl) {
    let PHONE_LENGTH = 9;
    if (
      control.value.startsWith('0') &&
      control.value.length === PHONE_LENGTH + 1
    ) {
      let value = control.value.substring(1);
      control.setValue(prefix.substring(1) + value);
    } else if (
      control.value.startsWith(prefix) &&
      control.value.length === PHONE_LENGTH + prefix.length
    ) {
      control.setValue(control.value.substring(1));
    } else if (
      !control.value.startsWith('0') &&
      !control.value.startsWith(prefix) &&
      control.value.length === PHONE_LENGTH
    ) {
      control.setValue(prefix.substring(1) + control.value);
    }
  }

  static moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  static convertDotNetJsonDateToDate(dotNetJSONDate: string) {
    let timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp);
  }

  static convertDateToYearMonthDay(parts: string[]) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  static dateToFormat(date: Date, format: string) {
    return formatDate(date, format, 'en');
  }

  static translatedDate(
    date: Date = new Date(),
    months: { name: string; abbreviation: string }[]
  ) {
    return (
      date.getDate() +
      ' ' +
      months[date.getMonth()].abbreviation +
      ' ' +
      date.getFullYear()
    );
  }

  static phoneNumberPrefixes() {
    return {
      tz: /^[67]\d{8}$/,
    };
  }

  static reformatDate(values: string[]) {
    let [year, month, date] = values;
    return `${date}/${month}/${year}`;
  }

  static requestFailedCatchError(
    err: any,
    dialog: DisplayMessageBoxComponent,
    tr: TranslocoService
  ) {
    if (err instanceof TimeoutError) {
      AppUtilities.openTimeoutError(dialog, tr);
    } else if (err.status === 500) {
      AppUtilities.unexpectedErrorOccured(dialog, tr);
    } else {
      AppUtilities.noInternetError(dialog, tr);
    }
  }
}
