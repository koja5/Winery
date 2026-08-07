import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [DynamicTableComponent],
  template: `<app-dynamic-table path="grids/admin" file="employees.json"></app-dynamic-table>`
})
export class EmployeesComponent {}
