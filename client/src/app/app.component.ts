import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IonApp } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

interface NavItem {
  icon: string;
  label: string;
  link: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IonApp, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'eVinarija';

  navItems: NavItem[] = [
    { icon: 'pi pi-box', label: 'nav.vessels', link: '/podrum/posude' },
    { icon: 'pi pi-shield', label: 'nav.superadmin', link: '/superadmin' }
  ];
}
