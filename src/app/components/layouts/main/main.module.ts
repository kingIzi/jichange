import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { RouteReuseStrategy } from '@angular/router';
import { DefaultRouteReuseStrategy } from 'src/app/utilities/default-route-reuse-strategy';

@NgModule({
  declarations: [],
  imports: [CommonModule, MainRoutingModule],
})
export class MainModule {}
