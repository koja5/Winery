export interface NavChild {
  title: string;
  route: string;
  locked?: boolean;
}

export interface NavItem {
  title: string;
  icon: string;
  route?: string;
  locked?: boolean;
  badge?: string;
  children?: NavChild[];
}

export interface NavGroup {
  label?: string;
  separator?: boolean;
  items: NavItem[];
}

// Ista grupna/hijerarhijska struktura kao eDestilerija navigation-menu.ts,
// prevedena na vino domen. `locked: true` = stranica još nije izgrađena u
// ovoj fazi backloga, vodi na "uskoro dostupno" umesto na 404.
export const NAVIGATION_MENU: NavGroup[] = [
  {
    items: [
      { title: 'nav.dashboard', icon: 'pi pi-th-large', route: '/dashboard' },
      { title: 'nav.reports.dynamic', icon: 'pi pi-chart-line', route: '/reports' }
    ]
  },
  {
    label: 'nav.group.podrum',
    items: [
      {
        title: 'nav.berba',
        icon: 'pi pi-sun',
        locked: true,
        children: [
          { title: 'nav.berba.receptions', route: '/podrum/berba/prijem', locked: true },
          { title: 'nav.berba.suppliers', route: '/podrum/berba/dobavljaci', locked: true }
        ]
      },
      {
        title: 'nav.vino',
        icon: 'pi pi-circle',
        locked: true,
        children: [
          { title: 'nav.vino.fermentation', route: '/podrum/vino/fermentacija', locked: true },
          { title: 'nav.vino.aging', route: '/podrum/vino/nega', locked: true },
          { title: 'nav.vino.charging', route: '/podrum/vino/punjenje', locked: true },
          { title: 'nav.vino.analyses', route: '/podrum/vino/analize' }
        ]
      },
      {
        title: 'nav.posude',
        icon: 'pi pi-box',
        children: [
          { title: 'nav.posude.list', route: '/podrum/posude' },
          { title: 'nav.posude.transfers', route: '/podrum/posude/pretoci' },
          { title: 'nav.posude.additions', route: '/podrum/posude/dodaci' }
        ]
      },
      { title: 'nav.workOrders', icon: 'pi pi-calendar-clock', route: '/podrum/radni-nalozi' },
      {
        title: 'nav.evidencije',
        icon: 'pi pi-clipboard',
        locked: true,
        children: [
          { title: 'nav.evidencije.cleaning', route: '/podrum/evidencije/ciscenje', locked: true },
          { title: 'nav.evidencije.analysis', route: '/podrum/evidencije/analize', locked: true }
        ]
      }
    ]
  },
  {
    label: 'nav.group.finance',
    items: [
      { title: 'nav.quotes', icon: 'pi pi-file-edit', route: '/finansije/ponude', locked: true, badge: 'nav.badge.new' },
      {
        title: 'nav.invoices',
        icon: 'pi pi-file',
        locked: true,
        children: [
          { title: 'nav.invoices.sales', route: '/finansije/fakture/prodaja', locked: true },
          { title: 'nav.invoices.purchase', route: '/finansije/fakture/nabavka', locked: true }
        ]
      }
    ]
  },
  {
    label: 'nav.group.collaborators',
    items: [
      { title: 'nav.customers', icon: 'pi pi-users', route: '/saradnici/kupci', locked: true },
      { title: 'nav.suppliers', icon: 'pi pi-truck', route: '/saradnici/dobavljaci', locked: true },
      { title: 'nav.employees', icon: 'pi pi-id-card', route: '/saradnici/zaposleni', locked: true }
    ]
  },
  {
    items: [
      { title: 'nav.documents', icon: 'pi pi-folder', route: '/dokumenti', locked: true }
    ]
  },
  {
    items: [{ title: 'nav.vinograd', icon: 'pi pi-map', route: '/vinograd', locked: true }]
  },
  {
    items: [
      {
        title: 'nav.settings',
        icon: 'pi pi-cog',
        locked: true,
        children: [
          { title: 'nav.settings.vessels', route: '/podesavanja/tipovi-posuda', locked: true },
          { title: 'nav.settings.varieties', route: '/podesavanja/sorte', locked: true }
        ]
      }
    ]
  }
];

export const SUPERADMIN_MENU: NavGroup[] = [
  {
    items: [
      { title: 'superadmin.nav.tenants', icon: 'pi pi-building', route: '/superadmin/tenants' },
      { title: 'superadmin.nav.users', icon: 'pi pi-users', route: '/superadmin/users' },
      { title: 'superadmin.nav.tickets', icon: 'pi pi-ticket', route: '/superadmin/tickets' }
    ]
  }
];
