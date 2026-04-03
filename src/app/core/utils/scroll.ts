export function scrollElementIntoView(
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
  attempt = 0,
  maxAttempts = 3,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  requestAnimationFrame(() => {
    const element = getElement();

    if (element) {
      scrollElementIntoView(element, options);
      return;
    }

    if (attempt < maxAttempts) {
      scrollElementIntoViewWhenReady(
        getElement,
        options,
        attempt + 1,
        maxAttempts,
      );
    }
  });
}
