import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-parcel-treatments',
  standalone: true,
  imports: [DynamicTableComponent],
  template: `<app-dynamic-table path="grids/admin" file="parcel-treatments.json"></app-dynamic-table>`
})
export class ParcelTreatmentsComponent {}
