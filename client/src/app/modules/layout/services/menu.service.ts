import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { NAVIGATION_MENU, SUPERADMIN_MENU, NavGroup } from '../config/navigation-menu';

const SIDEBAR_KEY = 'ev_sidebar_open';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private auth = inject(AuthService);

  showSidebar = signal(this.readSidebarState());
  showMobileMenu = signal(false);
  expandedItems = signal<Set<string>>(new Set());

  get menu(): NavGroup[] {
    return this.auth.currentUser()?.role === 'superadmin' ? SUPERADMIN_MENU : NAVIGATION_MENU;
  }

  toggleSidebar(): void {
    this.showSidebar.update((v) => !v);
    localStorage.setItem(SIDEBAR_KEY, String(this.showSidebar()));
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update((v) => !v);
  }

  toggleExpanded(title: string): void {
    this.expandedItems.update((set) => {
      const next = new Set(set);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  }

  isExpanded(title: string): boolean {
    return this.expandedItems().has(title);
  }

  private readSidebarState(): boolean {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored === null ? true : stored === 'true';
  }
}
