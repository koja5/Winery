import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface AppNotification {
  id: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private base = '/api/admin/notifications';

  private notifications = new BehaviorSubject<AppNotification[]>([]);
  private unreadCount = new BehaviorSubject<number>(0);

  notifications$ = this.notifications.asObservable();
  unreadCount$ = this.unreadCount.asObservable();

  loadNotifications(): void {
    this.http.get<AppNotification[]>(this.base).subscribe((list) => {
      this.notifications.next(list);
      this.unreadCount.next(list.filter((n) => !n.is_read).length);
    });
  }

  markAsRead(id: string): void {
    this.http.post(`${this.base}/${id}/read`, {}).subscribe(() => {
      const updated = this.notifications.value.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      this.notifications.next(updated);
      this.unreadCount.next(updated.filter((n) => !n.is_read).length);
    });
  }

  markAllAsRead(): void {
    this.http.post(`${this.base}/read-all`, {}).subscribe(() => {
      const updated = this.notifications.value.map((n) => ({ ...n, is_read: true }));
      this.notifications.next(updated);
      this.unreadCount.next(0);
    });
  }
}
