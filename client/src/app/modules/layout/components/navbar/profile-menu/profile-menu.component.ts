import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { ThemeService } from '../../../../../core/services/theme.service';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss'
})
export class ProfileMenuComponent {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private elRef = inject(ElementRef);

  isOpen = false;

  get user() {
    return this.auth.currentUser();
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  closeMenu(): void {
    this.isOpen = false;
  }

  setThemeMode(mode: 'dark' | 'light'): void {
    this.themeService.set(mode);
  }

  logout(): void {
    this.auth.logout();
    this.closeMenu();
    this.router.navigate(['/auth/sign-in']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) this.isOpen = false;
  }
}
