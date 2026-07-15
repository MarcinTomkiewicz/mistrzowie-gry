function scrollElementIntoView(
  element: HTMLElement | null | undefined,
  options: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'nearest',
  },
): void {
  if (typeof window === 'undefined' || !element) {
    return;
  }

  requestAnimationFrame(() => {
    element.scrollIntoView(options);
  });
}

export function scrollElementIntoViewWhenReady(
  getElement: () => HTMLElement | null | undefined,
  options?: ScrollIntoViewOptions,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const attemptScroll = (attempt: number): void => {
    requestAnimationFrame(() => {
      const element = getElement();

      if (element) {
        scrollElementIntoView(element, options);
        return;
      }

      if (attempt < 3) attemptScroll(attempt + 1);
    });
  };

  attemptScroll(0);
}
