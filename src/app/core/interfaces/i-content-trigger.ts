export interface IContentTrigger {
  id: string;
  slug: string;
  label: string;
  category: string | null;
  aliases: string[];
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}