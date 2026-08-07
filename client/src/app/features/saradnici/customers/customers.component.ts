import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [DynamicTableComponent],
  template: `<app-dynamic-table path="grids/admin" file="customers.json"></app-dynamic-table>`
})
export class CustomersComponent {}
