import {
  animate,
  animateChild,
  group,
  keyframes,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';

function fadeEase() {
  return [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        left: 0,
        width: '100%',
        opacity: 0,
        transform: 'scale(0) translateY(100%)',
      }),
    ]),
    query(':enter', [
      animate(
        '600ms ease',
        style({
          opacity: 1,
          transform: 'scale(1) translateY(0)',
        })
      ),
    ]),
  ];
}

function stepper() {
  return [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        left: 0,
        width: '100%',
      }),
    ]),
    group([
      query(':enter', [
        animate(
          '1000ms ease',
          keyframes([
            style({ transform: 'scale(0) translateX(100%)', offset: 0 }),
            style({ transform: 'scale(0.5) translateX(25%)', offset: 0.3 }),
            style({ transform: 'scale(1) translateX(0%)', offset: 1 }),
          ])
        ),
      ]),
      query(':leave', [
        animate(
          '1000ms ease',
          keyframes([
            style({ transform: 'scale(1)', offset: 0 }),
            style({
              transform: 'scale(0.5) translateX(-25%) rotate(0)',
              offset: 0.35,
            }),
            style({
              opacity: 0,
              transform: 'translateX(-50%) rotate(-180deg) scale(6)',
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
  ];
}

function slideTo(direction: string) {
  let optional = { optional: true };
  return [
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          [direction]: 0,
          width: '100%',
        }),
      ],
      optional
    ),
    query(':enter', [style({ [direction]: '-100%' })]),
    group([
      query(
        ':leave',
        [animate('600ms ease', style({ [direction]: '100%' }))],
        optional
      ),
      query(
        ':enter',
        [animate('600ms ease', style({ [direction]: '0%' }))],
        optional
      ),
    ]),
  ];
}

function transformTo({ x = 100, y = 0, rotate = 0 }) {
  const optional = { optional: true };
  return [
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ],
      optional
    ),
    query(':enter', [
      style({ transform: `translate(${x}%, ${y}%) rotate(${rotate}deg)` }),
    ]),
    group([
      query(
        ':leave',
        [
          animate(
            '600ms ease-out',
            style({ transform: `translate(${x}%, ${y}%) rotate(${rotate}deg)` })
          ),
        ],
        optional
      ),
      query(':enter', [
        animate(
          '600ms ease-out',
          style({ transform: `translate(0, 0) rotate(0)` })
        ),
      ]),
    ]),
  ];
}

// transition('* => isLeft', slideTo('left')),
//   transition('* => isRight', slideTo('right')),
//   transition('isRight => *', slideTo('left')),
//   transition('isLeft => *', slideTo('right')),

// transition('* => isLeft', transformTo({ x: -100, y: -100, rotate: -720 }) ),
//     transition('* => isRight', transformTo({ x: 100, y: -100, rotate: 90 }) ),
//     transition('isRight => *', transformTo({ x: -100, y: -100, rotate: 360 }) ),
//     transition('isLeft => *', transformTo({ x: 100, y: -100, rotate: -360 }) )

function generateFactorialStrings(arr: string[], delim: string) {
  const factorialStrings = arr
    .map((item, index) => {
      return arr
        .filter((_, innerIndex) => innerIndex !== index)
        .map((innerItem) => `${item} ${delim} ${innerItem}`);
    })
    .flat();
  return factorialStrings;
}

function generateModuleRoutes(inputStr: string, arr: string[], delim: string) {
  const beforeDelim = arr.map((item) => `${inputStr} ${delim} ${item}`);
  const afterDelim = arr.map((item) => `${item} ${delim} ${inputStr}`);
  return [beforeDelim, afterDelim];
}

let COMPANY_MODULES = 2;
let REPORTS_MODULES = 8;
let SETUP_MODULES = 14;
let LEFT_MODULES = 2;
let RIGHT_MODULES = 2;

let leftMoodules = Array.from(
  { length: LEFT_MODULES },
  (_, index) => `isLeft-${index + 1}`
);

let rightMoodules = Array.from(
  { length: RIGHT_MODULES },
  (_, index) => `isRight-${index + 1}`
);

let companyModules = Array.from(
  { length: COMPANY_MODULES },
  (_, index) => `company-module-${index + 1}`
);

let setupModules = Array.from(
  { length: SETUP_MODULES },
  (_, index) => `setup-module-${index + 1}`
);

let reportsModules = Array.from(
  { length: REPORTS_MODULES },
  (_, index) => `reports-module-${index + 1}`
);

let vendorInvoiceModules = Array.from(
  { length: 2 },
  (_, index) => `invoice-module-${index + 1}`
);

let vendorReportsModules = Array.from(
  { length: 7 },
  (_, index) => `reports-module-${index + 1}`
);

let vendorCompanyModules = Array.from(
  { length: 1 },
  (_, index) => `company-module-${index + 1}`
);

let companyRoutes = generateFactorialStrings(companyModules, '<=>');
let setupRoutes = generateFactorialStrings(setupModules, '<=>');
let reportsRoutes = generateFactorialStrings(reportsModules, '<=>');

let vendorInvoiceRoutes = generateFactorialStrings(vendorInvoiceModules, '<=>');
let vendorReportRoutes = generateFactorialStrings(vendorReportsModules, '<=>');
let vendorCompanyRoutes = generateFactorialStrings(vendorCompanyModules, '<=>');

function routesStates(initalArr: string[], arr: string[]) {
  let output: any[][] = [];
  initalArr.forEach((state) => {
    let results = generateModuleRoutes(state, arr, '<=>').flat();
    output.push(results);
  });
  return output.flat();
}

function nestedRouteStates(inputStr: string, arr: string[]) {
  let results = generateModuleRoutes(inputStr, arr, '<=>');
  return results.flat();
}

export const fader = trigger('triggerName', [
  transition(companyRoutes.join(','), fadeEase()),
  transition(setupRoutes.join(','), fadeEase()),
  transition(reportsRoutes.join(','), fadeEase()),
  transition('isLeft => isRight', slideTo('right')),
  transition('isRight => isLeft', slideTo('left')),
  transition('dashboard => *', slideTo('right')),
  transition('* => dashboard', slideTo('left')),
  transition('profile <=> *', stepper()),
  transition(routesStates(companyModules, setupModules).join(','), stepper()),
  transition(routesStates(companyModules, reportsModules).join(','), stepper()),
  transition(routesStates(setupModules, reportsModules).join(','), stepper()),
  transition(nestedRouteStates('isLeft', companyModules).join(','), stepper()),
  transition(nestedRouteStates('isLeft', setupModules).join(','), stepper()),
  transition(nestedRouteStates('isLeft', reportsModules).join(','), fadeEase()),
  transition(nestedRouteStates('isRight', companyModules).join(','), stepper()),
  transition(nestedRouteStates('isRight', setupModules).join(','), stepper()),
  transition(
    nestedRouteStates('isRight', reportsModules).join(','),
    fadeEase()
  ),
]);

export const vendorAnimations = trigger('vendorAnimate', [
  transition('dashboard => *', slideTo('right')),
  transition('* => dashboard', slideTo('left')),
  transition('profile <=> *', stepper()),
  transition(
    routesStates(vendorInvoiceModules, vendorReportsModules).join(','),
    stepper()
  ),
  transition(
    routesStates(vendorCompanyModules, vendorInvoiceModules).join(','),
    stepper()
  ),
  transition(
    routesStates(vendorCompanyModules, vendorReportsModules).join(','),
    stepper()
  ),
  transition(vendorInvoiceRoutes.join(','), fadeEase()),
  transition(vendorReportRoutes.join(','), fadeEase()),
  transition('isLeft-1 => isRight-1', slideTo('right')),
  transition('isRight-1 => isLeft-1', slideTo('left')),
  transition('isRight-1 => isRight-3', slideTo('right')),
  transition('isRight-3 => isRight-1', slideTo('left')),
  transition('isRight-3 => isLeft-1', slideTo('left')),
  transition(
    nestedRouteStates('isLeft-1', vendorInvoiceModules).join(','),
    stepper()
  ),
  transition(
    nestedRouteStates('isLeft-1', vendorReportsModules).join(','),
    stepper()
  ),
  transition(
    nestedRouteStates('isRight-1', vendorInvoiceModules).join(','),
    stepper()
  ),
  transition(
    nestedRouteStates('isRight-1', vendorReportsModules).join(','),
    stepper()
  ),
  transition(
    nestedRouteStates('isRight-3', vendorInvoiceModules).join(','),
    stepper()
  ),
  transition(
    nestedRouteStates('isRight-3', vendorReportsModules).join(','),
    stepper()
  ),
  transition('isRight-3 => company-module-1', stepper()),
  transition('isLeft-1 <=> company-module-1', stepper()),
  transition('isRight-1 <=> company-module-1', stepper()),
  transition('isRight-2 <=> isLeft-1', stepper()),
  transition('isLeft-2 => isRight-2', slideTo('right')),
  transition('isRight-2 => isLeft-2', slideTo('left')),
  transition(
    nestedRouteStates('isLeft-2', vendorInvoiceModules).join(','),
    stepper()
  ),
  transition(
    nestedRouteStates('isLeft-2', vendorReportsModules).join(','),
    stepper()
  ),
  transition(
    nestedRouteStates('isRight-2', vendorInvoiceModules).join(','),
    stepper()
  ),
  transition(
    nestedRouteStates('isRight-2', vendorReportsModules).join(','),
    stepper()
  ),
  transition('isLeft-2 <=> company-module-1', stepper()),
  transition('isRight-2 <=> company-module-1', stepper()),
  transition('isLeft-1 <=> isLeft-2', stepper()),
  transition('isRight-1 <=> isLeft-2', stepper()),
]);
