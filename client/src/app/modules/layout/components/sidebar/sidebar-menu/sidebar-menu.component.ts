import { Component, ElementRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { MenuService } from '../../../services/menu.service';
import { NavItem } from '../../../config/navigation-menu';
import { SidebarSubmenuComponent } from '../sidebar-submenu/sidebar-submenu.component';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AngularSvgIconModule, TranslateModule, SidebarSubmenuComponent],
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.scss'
})
export class SidebarMenuComponent implements OnInit, OnDestroy {
  menuService = inject(MenuService);
  private router = inject(Router);
  private el = inject(ElementRef);
  private sub = new Subscription();

  flyoutItem: NavItem | null = null;
  flyoutTop = 0;
  flyoutBottom = 0;
  flyoutOpenUpward = false;
  hoveredItem: NavItem | null = null;
  hoveredTop = 0;

  ngOnInit(): void {
    this.sub.add(
      this.router.events
        .pipe(filter((e) => e instanceof NavigationStart || e instanceof NavigationEnd))
        .subscribe(() => (this.flyoutItem = null))
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  toggleItem(item: NavItem): void {
    if (item.children) this.menuService.toggleExpanded(item.title);
  }

  isGroupActive(item: NavItem): boolean {
    if (!item.children) return false;
    const currentUrl = this.router.url.split('?')[0];
    return item.children.some((child) => child.route && currentUrl.startsWith(child.route));
  }

  handleIconClick(event: MouseEvent, item: NavItem): void {
    if (this.menuService.showSidebar()) {
      if (!item.locked) this.toggleItem(item);
      return;
    }
    // Collapsed sidebar mode
    if (item.locked) {
      this.router.navigate(['/uskoro'], { queryParams: { from: item.title } });
      return;
    }
    if (!item.children) return;
    event.stopPropagation();
    if (this.flyoutItem === item) {
      this.flyoutItem = null;
    } else {
      this.flyoutItem = item;
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const estimatedPanelHeight = 90 + (item.children?.length || 0) * 44;
      if (rect.top + estimatedPanelHeight > window.innerHeight - 20) {
        this.flyoutOpenUpward = true;
        this.flyoutBottom = window.innerHeight - rect.bottom - 8;
      } else {
        this.flyoutOpenUpward = false;
        this.flyoutTop = rect.top;
      }
    }
  }

  closeFlyout(): void {
    this.flyoutItem = null;
  }

  onItemMouseEnter(event: MouseEvent, item: NavItem): void {
    if (!this.menuService.showSidebar()) {
      this.hoveredItem = item;
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.hoveredTop = rect.top + rect.height / 2;
    }
  }

  onItemMouseLeave(item: NavItem): void {
    if (this.hoveredItem === item) this.hoveredItem = null;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.flyoutItem) this.flyoutItem = null;
  }
}
