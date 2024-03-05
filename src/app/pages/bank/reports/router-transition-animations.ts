import { query, style, transition, trigger } from '@angular/animations';
export const routeTransitionAnimations = trigger('triggerName', [
  transition('transactions => transactions-id', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100%',
      }),
    ]),
  ]),
]);
