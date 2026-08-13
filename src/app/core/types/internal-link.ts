export interface InternalLinkMarkupTextNode {
  type: 'text';
  text: string;
}

export interface InternalLinkMarkupLinkNode {
  type: 'link';
  text: string;
  href: string;
  external?: boolean;
}

export type InternalLinkMarkupNode =
  | InternalLinkMarkupTextNode
  | InternalLinkMarkupLinkNode;
