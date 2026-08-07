import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TabsModule } from 'primeng/tabs';
import { ComingSoonComponent } from '../../shared/components/coming-soon/coming-soon.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { TenantSettingsComponent } from './tenant-settings/tenant-settings.component';
import { ChangePasswordSettingsComponent } from './change-password-settings/change-password-settings.component';

interface SettingsTab {
  id: string;
  labelKey: string;
  icon: string;
  locked?: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TabsModule,
    ComingSoonComponent,
    ProfileSettingsComponent,
    TenantSettingsComponent,
    ChangePasswordSettingsComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  // Isti obrazac tabova kao u eDestileriji (12 tabova): tabovi bez backing modula
  // (paket, partner, finansije, izvozna faktura, bankovni računi, ponude,
  // eFaktura, eOtpremnica, demo podaci) prikazuju "uskoro dostupno" dok se
  // odgovarajući moduli ne implementiraju.
  tabs: SettingsTab[] = [
    { id: 'profile', labelKey: 'accountSettings.tabs.profile', icon: 'pi pi-user' },
    { id: 'license', labelKey: 'accountSettings.tabs.license', icon: 'pi pi-crown', locked: true },
    { id: 'partner', labelKey: 'accountSettings.tabs.partner', icon: 'pi pi-share-alt', locked: true },
    { id: 'tenant', labelKey: 'accountSettings.tabs.tenant', icon: 'pi pi-building' },
    { id: 'finance', labelKey: 'accountSettings.tabs.finance', icon: 'pi pi-credit-card', locked: true },
    { id: 'inoInvoice', labelKey: 'accountSettings.tabs.inoInvoice', icon: 'pi pi-globe', locked: true },
    { id: 'bankAccounts', labelKey: 'accountSettings.tabs.bankAccounts', icon: 'pi pi-wallet', locked: true },
    { id: 'changePassword', labelKey: 'accountSettings.tabs.changePassword', icon: 'pi pi-key' },
    { id: 'quotes', labelKey: 'accountSettings.tabs.quotes', icon: 'pi pi-book', locked: true },
    { id: 'efaktura', labelKey: 'accountSettings.tabs.efaktura', icon: 'pi pi-file-edit', locked: true },
    { id: 'eotpremnica', labelKey: 'accountSettings.tabs.eotpremnica', icon: 'pi pi-truck', locked: true },
    { id: 'demoData', labelKey: 'accountSettings.tabs.demoData', icon: 'pi pi-database', locked: true }
  ];
}
