import { i18n } from '@lingui/core';

export const enMessages = {
  Settings: 'Settings',
  'Sign out': 'Sign out',
  Profile: 'Profile',
  Experience: 'Experience',
  Accounts: 'Accounts',
  Members: 'Members',
  Roles: 'Roles',
  'API keys': 'API keys',
  Billing: 'Billing',
  'Permission overview': 'Permission overview',
  'View keys · manage on web': 'View keys · manage on web',
  'Status on web': 'Status on web',
  Dashboards: 'Dashboards',
  Workflows: 'Workflows',
  'Continue with Microsoft': 'Continue with Microsoft',
  'Continue with Google': 'Continue with Google',
  'Continue with Email': 'Continue with Email',
  'Sign in with Microsoft, Google, or your workspace email':
    'Sign in with Microsoft, Google, or your workspace email',
  'Reconnect account':
    'One or more connected accounts need to be reconnected.',
  'Offline · showing cached data': 'Offline · showing cached data',
  'Theme and language': 'Theme and language',
  'Name and email': 'Name and email',
  'Email and calendar providers': 'Email and calendar providers',
  'Workspace members': 'Workspace members',
  'Read KPIs': 'Read KPIs',
  'Runs and manual trigger': 'Runs and manual trigger',
} as const;

export const frMessages = {
  Settings: 'Paramètres',
  'Sign out': 'Se déconnecter',
  Profile: 'Profil',
  Experience: 'Expérience',
  Accounts: 'Comptes',
  Members: 'Membres',
  Roles: 'Rôles',
  'API keys': 'Clés API',
  Billing: 'Facturation',
  'Permission overview': 'Aperçu des permissions',
  'View keys · manage on web': 'Voir les clés · gérer sur le web',
  'Status on web': 'Statut sur le web',
  Dashboards: 'Tableaux de bord',
  Workflows: 'Workflows',
  'Continue with Microsoft': 'Continuer avec Microsoft',
  'Continue with Google': 'Continuer avec Google',
  'Continue with Email': 'Continuer avec e-mail',
  'Sign in with Microsoft, Google, or your workspace email':
    'Connectez-vous avec Microsoft, Google ou votre e-mail',
  'Reconnect account':
    'Un ou plusieurs comptes connectés doivent être reconnectés.',
  'Offline · showing cached data': 'Hors ligne · données en cache',
  'Theme and language': 'Thème et langue',
  'Name and email': 'Nom et e-mail',
  'Email and calendar providers': 'E-mail et calendrier',
  'Workspace members': 'Membres de l’espace',
  'Read KPIs': 'Indicateurs KPI',
  'Runs and manual trigger': 'Exécutions et déclenchement',
} as const;

export const activateLocale = (locale: string) => {
  const normalized = locale.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  i18n.load({
    en: enMessages,
    fr: frMessages,
  });
  i18n.activate(normalized);
};

activateLocale('en');

export { i18n };
