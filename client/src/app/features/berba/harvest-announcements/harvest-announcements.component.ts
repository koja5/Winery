import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-harvest-announcements',
  standalone: true,
  imports: [DynamicTableComponent],
  template: `<app-dynamic-table path="grids/admin" file="harvest-announcements.json"></app-dynamic-table>`
})
export class HarvestAnnouncementsComponent {}
