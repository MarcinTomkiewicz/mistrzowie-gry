import {
  Injectable,
  inject,
  signal
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ISeoConfig } from '../../interfaces/i-seo';
import { Platform } from '../platform/platform';

@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly platform = inject(Platform);

  readonly last = signal<ISeoConfig | null>(null);

  private readonly siteName = 'Mistrzowie Gry';

  private readonly defaultDescription =
    'Nie przejmuj się brakiem Mistrza Gry ani czytaniem podręczników. Organizujemy sesje RPG dla początkujących, prowadzimy gry fabularne, pomagamy zacząć grać i znaleźć drużynę.';

  apply(config: ISeoConfig): void {
    const normalized = this.normalize(config);
    this.last.set(normalized);

    this.title.setTitle(normalized.title);

    this.setMetaName('description', normalized.description ?? this.defaultDescription);
    if (normalized.robots) {
      this.setMetaName('robots', normalized.robots);
    } else {
      this.removeMetaName('robots');
    }

    const og = normalized.og;
    if (og) {
      this.setMetaProperty('og:title', og.title ?? normalized.title);
      if (og.description ?? normalized.description) {
        this.setMetaProperty('og:description', og.description ?? normalized.description ?? this.defaultDescription);
      }
      this.setMetaProperty('og:type', og.type ?? 'website');

      const url = og.url ?? normalized.canonicalUrl ?? this.buildAbsoluteUrl();
      if (url) this.setMetaProperty('og:url', url);

      if (og.siteName ?? this.siteName) {
        this.setMetaProperty('og:site_name', og.siteName ?? this.siteName);
      }

      this.removeMetaProperty('og:image');
      this.removeMetaProperty('og:image:width');
      this.removeMetaProperty('og:image:height');
      this.removeMetaProperty('og:image:alt');
      this.removeMetaProperty('og:image:type');

      if (og.images?.length) {
        for (const img of og.images) {
          this.addMetaProperty('og:image', img.url);
          if (img.width) this.addMetaProperty('og:image:width', String(img.width));
          if (img.height) this.addMetaProperty('og:image:height', String(img.height));
          if (img.alt) this.addMetaProperty('og:image:alt', img.alt);
          if (img.type) this.addMetaProperty('og:image:type', img.type);
        }
      }
    }

    const tw = normalized.twitter;
    if (tw) {
      this.setMetaName('twitter:card', tw.card ?? 'summary');
      this.setMetaName('twitter:title', tw.title ?? normalized.title);
      if (tw.description ?? normalized.description) {
        this.setMetaName('twitter:description', tw.description ?? normalized.description ?? this.defaultDescription);
      }
      if (tw.image) {
        this.setMetaName('twitter:image', tw.image);
      } else {
        this.removeMetaName('twitter:image');
      }
    }

    const canonical = normalized.canonicalUrl ?? this.buildAbsoluteUrl();
    if (canonical) {
      this.setCanonical(canonical);
    }
  }

  clear(): void {
    this.last.set(null);
    this.title.setTitle(this.siteName);
    this.removeMetaName('description');
    this.removeMetaName('robots');
  }

  private normalize(config: ISeoConfig): ISeoConfig {
    const title = config.title.includes(this.siteName)
      ? config.title
      : `${config.title} • ${this.siteName}`;

    return {
      ...config,
      title,
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
    if (!this.platform.isBrowser) return;
    const doc = this.platform.document;
    if (!doc) return;

    let link = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private buildAbsoluteUrl(): string | null {
    if (!this.platform.isBrowser) return null;

    const loc = this.platform.location;
    if (!loc) return null;

    const origin = loc.origin;
    const path = this.router.url || '/';
    return `${origin}${path}`;
  }
}
