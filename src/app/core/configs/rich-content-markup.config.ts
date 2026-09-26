import {
  INTERNAL_LINK_MARKUP_CLOSE,
  INTERNAL_LINK_MARKUP_OPEN,
} from './internal-link.config';

export const RICH_CONTENT_INLINE_MARKUP = {
  link: { open: INTERNAL_LINK_MARKUP_OPEN, close: INTERNAL_LINK_MARKUP_CLOSE },
  dialog: { open: '[dialog=', close: '[/dialog]' },
  strong: { open: '[strong]', close: '[/strong]' },
};
