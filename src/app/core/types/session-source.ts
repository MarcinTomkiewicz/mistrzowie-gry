export type SessionSourceKind = 'template' | 'custom';

export const SESSION_SOURCE_CONFIG = {
  template: {
    sessionsTable: 'gm_session_templates',
    stylesTable: 'gm_session_template_styles',
    triggersTable: 'gm_session_template_triggers',
    languagesTable: 'gm_session_template_languages',
    characterSheetsTable: 'gm_session_template_character_sheets',
    sessionIdKey: 'gmSessionTemplateId',
  },
  custom: {
    sessionsTable: 'custom_sessions',
    stylesTable: 'custom_session_styles',
    triggersTable: 'custom_session_triggers',
    languagesTable: 'custom_session_languages',
    characterSheetsTable: 'custom_session_character_sheets',
    sessionIdKey: 'customSessionId',
  },
} as const;
