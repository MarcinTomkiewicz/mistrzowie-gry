export type AboutSectionRaw = {
  id: number;
  title: string;
  paragraphs?: Record<string, string>;
};

export type AboutSection = {
  id: number;
  title: string;
  paragraphs: string[];
};

export type AboutCardRaw = {
  id: number;
  title: string;
  paragraphs?: Record<string, string>;
};

export type AboutCard = {
  id: number;
  title: string;
  paragraphs: string[];
};

export type AboutSeo = {
  title: string;
  description: string;
};

export type AboutHero = {
  title: string;
  subtitle: string;
};
