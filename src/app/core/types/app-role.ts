export const APP_ROLES = [
  'user',
  'gm',
  'marketing_manager',
  'customer_manager',
  'lead_coordinator',
  'admin',
] as const;

export type AppRole = (typeof APP_ROLES)[number];