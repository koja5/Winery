import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { MenuService } from '../../services/menu.service';
import { GlobalSearchComponent } from './global-search/global-search.component';
import { NotificationBellComponent } from './notification-bell/notification-bell.component';
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, GlobalSearchComponent, NotificationBellComponent, ProfileMenuComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  menuService = inject(MenuService);

  get user() {
    return this.auth.currentUser();
  }
}
