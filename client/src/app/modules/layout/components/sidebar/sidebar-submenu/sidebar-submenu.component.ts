import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MenuService } from '../../../services/menu.service';
import { NavItem } from '../../../config/navigation-menu';

@Component({
  selector: 'app-sidebar-submenu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar-submenu.component.html',
  styleUrl: './sidebar-submenu.component.scss'
})
export class SidebarSubmenuComponent {
  @Input() submenu: NavItem = { title: '', icon: '' };

  menuService = inject(MenuService);

  get expanded(): boolean {
    return this.menuService.isExpanded(this.submenu.title);
  }
}
