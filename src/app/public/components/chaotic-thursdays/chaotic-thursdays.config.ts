import { IconTech } from '../../../core/types/icon-tech';

export const CHAOTIC_HIGHLIGHT_ICONS: readonly IconTech[] = [
  { id: 1, icon: 'pi pi-bolt' },
  { id: 2, icon: 'pi pi-question-circle' },
  { id: 3, icon: 'pi pi-users' },
  { id: 4, icon: 'pi pi-star' },
] as const;

export const CHAOTIC_STANDARDS_ICONS: readonly IconTech[] = [
  { id: 1, icon: 'pi pi-shield' },
  { id: 2, icon: 'pi pi-clock' },
  { id: 3, icon: 'pi pi-comments' },
  { id: 4, icon: 'pi pi-check' },
] as const;

export const CHAOTIC_SPARK_DICE = [1, 2, 3] as const;