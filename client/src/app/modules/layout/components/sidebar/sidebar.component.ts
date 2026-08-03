import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MenuService } from '../../services/menu.service';
import { NavItem } from '../../config/navigation-menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  menuService = inject(MenuService);

  toggle(): void {
    this.menuService.toggleSidebar();
  }

  toggleItem(item: NavItem): void {
    if (item.children) {
      this.menuService.toggleExpanded(item.title);
    }
  }
}
