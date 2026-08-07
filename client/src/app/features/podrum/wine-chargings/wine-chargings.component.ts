import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-wine-chargings',
  standalone: true,
  imports: [DynamicTableComponent],
  template: `<app-dynamic-table path="grids/admin" file="wine-chargings.json"></app-dynamic-table>`
})
export class WineChargingsComponent {}
