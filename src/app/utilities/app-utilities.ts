import { TranslocoService } from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../components/dialogs/success-message-box/success-message-box.component';
import { FormControl } from '@angular/forms';
import { SubmitMessageBoxComponent } from '../components/dialogs/submit-message-box/submit-message-box.component';
import { formatDate } from '@angular/common';
import { Observable, TimeoutError, catchError, lastValueFrom, map } from 'rxjs';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { HttpDataResponse } from '../core/models/http-data-response';
import { toast } from 'ngx-sonner';

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

  static sweetAlertSuccessMessage(message: string, timeout: number = 5000) {
    let toastMixin = Swal.mixin({
      toast: true,
      icon: 'success',
      title: 'General Title',
      animation: false,
      position: 'top-right',
      showConfirmButton: false,
      timer: timeout,
      didOpen: (toast: any) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    } as any) as any;
    return toastMixin.fire({
      animation: true,
      title: message,
    });
  }
  static showSuccessMessage(
    message: string,
    handler: (e: MouseEvent) => void,
    view: string
  ) {
    toast.success(message, {
      action: {
        label: view,
        onClick: handler,
      },
    });
  }
  static redirectPage(path: string, queryParams: {}, router: Router) {
    return (e: MouseEvent) => {
      router.navigate([path], {
        ...queryParams,
      });
    };
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

  static unAuthorizedUserError(
    dialog: DisplayMessageBoxComponent,
    tr: TranslocoService
  ) {
    AppUtilities.openDisplayMessageBox(
      dialog,
      tr.translate(`errors.accessDenied`),
      tr.translate(`errors.unAuthorizedUser`)
    );
  }

  static requestFailedCatchError(
    err: any,
    dialog: DisplayMessageBoxComponent,
    tr: TranslocoService
  ) {
    if (err instanceof TimeoutError || err.status === 0) {
      AppUtilities.openTimeoutError(dialog, tr);
    } else if (err.status === 500) {
      AppUtilities.unexpectedErrorOccured(dialog, tr);
    }
  }

  static pipedObservables<T>(merged: Observable<T>) {
    let res = lastValueFrom(
      merged.pipe(
        map((result) => {
          return result;
        }),
        catchError((err) => {
          throw err;
        })
      )
    );
    return res;
  }

  static navigateWithNoBack(router: Router, path: string): void {
    router.navigate([path]).then(() => {
      window.history.replaceState(null, '', window.location.href);
    });
  }

  static hasErrorResult(result: HttpDataResponse<number | any>) {
    return typeof result.response === 'number' && result.response === 0;
  }

  static switchGenericSetupErrorMessage(
    message: string,
    tr: TranslocoService,
    exists: string
  ) {
    switch (message.toLocaleLowerCase()) {
      case 'Already exists.'.toLocaleLowerCase():
        return tr.translate(`errors.alreadyExists`).replace('{}', exists);
      case 'An error occured on the server.'.toLocaleLowerCase():
        return tr.translate(`errors.serverError`);
      case 'No data found.'.toLocaleLowerCase():
        return tr.translate(`errors.noDataFound`);
      case 'Not found.'.toLocaleLowerCase():
        return tr.translate(`errors.notFound`);
      default:
        return '';
    }
  }

  static replaceUnderscoreValue(label: string) {
    return label
      .replace(/_/g, ' ')
      .split(' ')
      .map(
        (word: string) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(' ');
  }
}
