import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';
import { WorkOrdersCalendarComponent } from '../../podrum/work-orders/work-orders-calendar.component';

@Component({
  selector: 'app-vineyard-work-orders',
  standalone: true,
  imports: [TranslateModule, DynamicTableComponent, WorkOrdersCalendarComponent],
  templateUrl: './vineyard-work-orders.component.html',
  styleUrl: './vineyard-work-orders.component.scss'
})
export class VineyardWorkOrdersComponent {
  view: 'grid' | 'calendar' = 'grid';
}
