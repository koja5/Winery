import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkOrdersService } from './work-orders.service';

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  orders: Record<string, any>[];
}

@Component({
  selector: 'app-work-orders-calendar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './work-orders-calendar.component.html',
  styleUrl: './work-orders-calendar.component.scss'
})
export class WorkOrdersCalendarComponent implements OnInit {
  @Input() apiUrl = '/api/admin/work-orders';

  private ordersService = inject(WorkOrdersService);
  private translate = inject(TranslateService);

  viewDate = new Date();
  weeks: CalendarDay[][] = [];
  allOrders: Record<string, any>[] = [];

  readonly weekdayLabels = ['pon', 'uto', 'sre', 'čet', 'pet', 'sub', 'ned'];

  ngOnInit(): void {
    this.load();
  }

  get monthLabel(): string {
    return this.viewDate.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  priorityLabel(order: Record<string, any>): string {
    return this.translate.instant(`workOrders.priority.${order['priority']}`);
  }

  private load(): void {
    this.ordersService.list(this.apiUrl).subscribe((orders) => {
      this.allOrders = orders;
      this.buildCalendar();
    });
  }

  private buildCalendar(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);

    // Monday-first grid: shift back to the Monday on/before the 1st.
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - firstWeekday);

    const today = new Date();
    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      days.push({
        date,
        inCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        orders: this.ordersForDate(date)
      });
    }

    this.weeks = [];
    for (let i = 0; i < 6; i++) {
      this.weeks.push(days.slice(i * 7, i * 7 + 7));
    }
  }

  private ordersForDate(date: Date): Record<string, any>[] {
    const key = date.toDateString();
    // `due_date` arrives as a full ISO instant (mysql2 serializes DATE
    // columns as UTC-instant Date objects) — `new Date()` + local
    // `toDateString()` converts back to the calendar day correctly.
    // Slicing the string to "YYYY-MM-DD" would ignore that conversion and
    // misread the day whenever server/client aren't both UTC.
    return this.allOrders.filter((o) => new Date(o['due_date']).toDateString() === key);
  }
}
