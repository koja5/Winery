import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-fermentations',
  standalone: true,
  imports: [DynamicTableComponent],
  template: `<app-dynamic-table path="grids/admin" file="fermentations.json"></app-dynamic-table>`
})
export class FermentationsComponent {}
