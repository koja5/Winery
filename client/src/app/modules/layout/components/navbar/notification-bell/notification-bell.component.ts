import { Component, ElementRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationsService, AppNotification } from '../../../../../core/services/notifications.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notificationsService = inject(NotificationsService);
  private router = inject(Router);
  private elRef = inject(ElementRef);
  private destroy$ = new Subject<void>();

  unreadCount = 0;
  notifications: AppNotification[] = [];
  isOpen = false;

  ngOnInit(): void {
    this.notificationsService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe((count) => (this.unreadCount = count));
    this.notificationsService.notifications$.pipe(takeUntil(this.destroy$)).subscribe((list) => (this.notifications = list));
    this.notificationsService.loadNotifications();
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.notificationsService.loadNotifications();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) this.isOpen = false;
  }

  onNotificationClick(notification: AppNotification): void {
    this.notificationsService.markAsRead(notification.id);
    this.isOpen = false;
    if (notification.action_url) this.router.navigateByUrl(notification.action_url);
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      stock: 'pi pi-box',
      work_order: 'pi pi-calendar-clock',
      system: 'pi pi-info-circle'
    };
    return icons[type] ?? 'pi pi-bell';
  }

  getSeverityClass(severity: string): string {
    const classes: Record<string, string> = {
      info: 'notif-info',
      success: 'notif-success',
      warning: 'notif-warning',
      error: 'notif-error'
    };
    return classes[severity] ?? 'notif-info';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
