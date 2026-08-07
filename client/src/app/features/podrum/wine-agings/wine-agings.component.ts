import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-wine-agings',
  standalone: true,
  imports: [DynamicTableComponent],
  template: `<app-dynamic-table path="grids/admin" file="wine-agings.json"></app-dynamic-table>`
})
export class WineAgingsComponent {}
