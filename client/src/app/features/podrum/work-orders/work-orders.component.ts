import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';
import { WorkOrdersCalendarComponent } from './work-orders-calendar.component';

@Component({
  selector: 'app-work-orders',
  standalone: true,
  imports: [TranslateModule, DynamicTableComponent, WorkOrdersCalendarComponent],
  templateUrl: './work-orders.component.html',
  styleUrl: './work-orders.component.scss'
})
export class WorkOrdersComponent {
  view: 'grid' | 'calendar' = 'grid';
}
