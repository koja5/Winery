import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-superadmin-tickets',
  standalone: true,
  imports: [DynamicTableComponent],
  template: `<app-dynamic-table path="grids/superadmin" file="support-tickets.json"></app-dynamic-table>`
})
export class SuperadminTicketsComponent {}
