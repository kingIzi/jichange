import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const toggle = trigger('toggle', [
  transition(':enter', [
    style({ height: 0, opacity: 0 }),
    animate('1s ease-out', style({ height: 300, opacity: 1 })),
  ]),
  transition(':leave', [
    style({ height: 300, opacity: 1 }),
    animate('1s ease-in', style({ height: 0, opacity: 0 })),
  ]),
]);

export const divToggle = trigger('divToggle', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('1s ease-out', style({ opacity: 1 })),
  ]),
  transition(':leave', [
    style({ opacity: 1 }),
    animate('1s ease-in', style({ opacity: 0 })),
  ]),
]);

export const opacityFadeTrigger = trigger('opacityFadeTrigger', [
  transition('isLeft <=> isRight', [
    style({ opacity: 0, position: 'relative' }),
    animate('0.5s ease-out', style({ opacity: 1 })),
  ]),
]);
