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
// Ikonice su heroicons svg putanje (isti set kao eDestilerija sidebar).
export const NAVIGATION_MENU: NavGroup[] = [
  {
    items: [
      { title: 'nav.dashboard', icon: 'assets/icons/heroicons/outline/dashboard.svg', route: '/dashboard' },
      { title: 'nav.reports.dynamic', icon: 'assets/icons/heroicons/outline/chart-pie.svg', route: '/reports' }
    ]
  },
  {
    label: 'nav.group.podrum',
    items: [
      {
        title: 'nav.berba',
        icon: 'assets/icons/heroicons/outline/sun.svg',
        children: [
          { title: 'nav.berba.receptions', route: '/podrum/berba/prijem' },
          { title: 'nav.berba.announcements', route: '/podrum/berba/najave' },
          { title: 'nav.berba.suppliers', route: '/podrum/berba/dobavljaci' },
          { title: 'nav.berba.settlements', route: '/podrum/berba/obracuni' }
        ]
      },
      {
        title: 'nav.vino',
        icon: 'assets/icons/heroicons/outline/destillation.svg',
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
        icon: 'assets/icons/heroicons/outline/cube.svg',
        children: [
          { title: 'nav.posude.list', route: '/podrum/posude' },
          { title: 'nav.posude.transfers', route: '/podrum/posude/pretoci' },
          { title: 'nav.posude.additions', route: '/podrum/posude/dodaci' }
        ]
      },
      { title: 'nav.workOrders', icon: 'assets/icons/heroicons/outline/document-text.svg', route: '/podrum/radni-nalozi' },
      {
        title: 'nav.evidencije',
        icon: 'assets/icons/heroicons/outline/records.svg',
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
      { title: 'nav.quotes', icon: 'assets/icons/heroicons/outline/quotes.svg', route: '/finansije/ponude', locked: true, badge: 'nav.badge.new' },
      {
        title: 'nav.invoices',
        icon: 'assets/icons/heroicons/outline/invoices.svg',
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
      { title: 'nav.customers', icon: 'assets/icons/heroicons/outline/user-circle.svg', route: '/saradnici/kupci', locked: true },
      { title: 'nav.suppliers', icon: 'assets/icons/heroicons/outline/supplier.svg', route: '/saradnici/dobavljaci', locked: true },
      { title: 'nav.employees', icon: 'assets/icons/heroicons/outline/employee.svg', route: '/saradnici/zaposleni', locked: true }
    ]
  },
  {
    items: [
      { title: 'nav.documents', icon: 'assets/icons/heroicons/outline/folder.svg', route: '/dokumenti', locked: true }
    ]
  },
  {
    items: [{ title: 'nav.vinograd', icon: 'assets/icons/heroicons/outline/tree.svg', route: '/vinograd', locked: true }]
  },
  {
    items: [
      {
        title: 'nav.settings',
        icon: 'assets/icons/heroicons/outline/cog.svg',
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
      { title: 'superadmin.nav.tenants', icon: 'assets/icons/heroicons/outline/warehouse.svg', route: '/superadmin/tenants' },
      { title: 'superadmin.nav.users', icon: 'assets/icons/heroicons/outline/users.svg', route: '/superadmin/users' },
      { title: 'superadmin.nav.tickets', icon: 'assets/icons/heroicons/outline/records.svg', route: '/superadmin/tickets' }
    ]
  }
];
