import { DOCUMENT, Injectable, REQUEST, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ISeoConfig } from '../../interfaces/i-seo';

@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });

  readonly last = signal<ISeoConfig | null>(null);

  private readonly siteName = 'Mistrzowie Gry';

  private readonly defaultDescription =
    'Nie przejmuj się brakiem Mistrza Gry ani czytaniem podręczników. Organizujemy sesje RPG dla początkujących, prowadzimy gry fabularne, pomagamy zacząć grać i znaleźć drużynę.';

  apply(config: ISeoConfig): void {
    const normalized = this.normalize(config);
    const absoluteUrl =
      normalized.canonicalUrl ?? this.buildAbsoluteUrl() ?? undefined;

    this.last.set(normalized);
    this.title.setTitle(normalized.title);

    this.setMetaName(
      'description',
      normalized.description ?? this.defaultDescription,
    );

    if (normalized.robots) {
      this.setMetaName('robots', normalized.robots);
    } else {
      this.removeMetaName('robots');
    }

    this.applyOpenGraph(normalized, absoluteUrl);
    this.applyTwitter(normalized);

    if (absoluteUrl) {
      this.setCanonical(absoluteUrl);
    } else {
      this.removeCanonical();
    }
  }

  clear(): void {
    this.last.set(null);
    this.title.setTitle(this.siteName);

    this.removeMetaName('description');
    this.removeMetaName('robots');

    this.removeMetaProperty('og:title');
    this.removeMetaProperty('og:description');
    this.removeMetaProperty('og:type');
    this.removeMetaProperty('og:url');
    this.removeMetaProperty('og:site_name');
    this.removeMetaProperty('og:image');
    this.removeMetaProperty('og:image:width');
    this.removeMetaProperty('og:image:height');
    this.removeMetaProperty('og:image:alt');
    this.removeMetaProperty('og:image:type');

    this.removeMetaName('twitter:card');
    this.removeMetaName('twitter:title');
    this.removeMetaName('twitter:description');
    this.removeMetaName('twitter:image');

    this.removeCanonical();
  }

  private applyOpenGraph(
    config: ISeoConfig,
    absoluteUrl?: string,
  ): void {
    const og = config.og;

    if (!og) {
      this.removeMetaProperty('og:title');
      this.removeMetaProperty('og:description');
      this.removeMetaProperty('og:type');
      this.removeMetaProperty('og:url');
      this.removeMetaProperty('og:site_name');
      this.removeMetaProperty('og:image');
      this.removeMetaProperty('og:image:width');
      this.removeMetaProperty('og:image:height');
      this.removeMetaProperty('og:image:alt');
      this.removeMetaProperty('og:image:type');
      return;
    }

    this.setMetaProperty('og:title', og.title ?? config.title);
    this.setMetaProperty(
      'og:description',
      og.description ?? config.description ?? this.defaultDescription,
    );
    this.setMetaProperty('og:type', og.type ?? 'website');
    this.setMetaProperty('og:site_name', og.siteName ?? this.siteName);

    const ogUrl = og.url ?? absoluteUrl;
    if (ogUrl) {
      this.setMetaProperty('og:url', ogUrl);
    } else {
      this.removeMetaProperty('og:url');
    }

    this.removeMetaProperty('og:image');
    this.removeMetaProperty('og:image:width');
    this.removeMetaProperty('og:image:height');
    this.removeMetaProperty('og:image:alt');
    this.removeMetaProperty('og:image:type');

    if (!og.images?.length) return;

    for (const img of og.images) {
      this.addMetaProperty('og:image', img.url);

      if (img.width) {
        this.addMetaProperty('og:image:width', String(img.width));
      }

      if (img.height) {
        this.addMetaProperty('og:image:height', String(img.height));
      }

      if (img.alt) {
        this.addMetaProperty('og:image:alt', img.alt);
      }

      if (img.type) {
        this.addMetaProperty('og:image:type', img.type);
      }
    }
  }

  private applyTwitter(config: ISeoConfig): void {
    const twitter = config.twitter;

    if (!twitter) {
      this.removeMetaName('twitter:card');
      this.removeMetaName('twitter:title');
      this.removeMetaName('twitter:description');
      this.removeMetaName('twitter:image');
      return;
    }

    this.setMetaName('twitter:card', twitter.card ?? 'summary');
    this.setMetaName('twitter:title', twitter.title ?? config.title);
    this.setMetaName(
      'twitter:description',
      twitter.description ?? config.description ?? this.defaultDescription,
    );

    if (twitter.image) {
      this.setMetaName('twitter:image', twitter.image);
    } else {
      this.removeMetaName('twitter:image');
    }
  }

  private normalize(config: ISeoConfig): ISeoConfig {
    const rawTitle = config.title.trim();

    return {
      ...config,
      title: rawTitle.includes(this.siteName)
        ? rawTitle
        : `${rawTitle} - ${this.siteName}`,
      description: config.description?.trim() || undefined,
      canonicalUrl: config.canonicalUrl?.trim() || undefined,
    };
  }

  private setMetaName(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name='${name}'`);
  }

  private removeMetaName(name: string): void {
    this.meta.removeTag(`name='${name}'`);
  }

  private setMetaProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  private addMetaProperty(property: string, content: string): void {
    this.meta.addTag({ property, content });
  }

  private removeMetaProperty(property: string): void {
    this.meta.removeTag(`property='${property}'`);
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private removeCanonical(): void {
    this.document.head
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.remove();
  }

  private buildAbsoluteUrl(): string | null {
    const requestUrl = this.request?.url;
    if (requestUrl) {
      return requestUrl;
    }

    const href = this.document.location?.href;
    return href || null;
  }
}