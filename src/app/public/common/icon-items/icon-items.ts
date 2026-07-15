import { IconTech } from '../../../core/types/icon-tech';

export function withIcons<T extends { id: number }>(
  items: readonly T[],
  icons: readonly IconTech[],
): Array<T & { icon: string }> {
  const iconsById = new Map(icons.map(({ id, icon }) => [id, icon]));

  return items.flatMap((item) => {
    const icon = iconsById.get(item.id);
    return icon ? [{ ...item, icon }] : [];
  });
}
