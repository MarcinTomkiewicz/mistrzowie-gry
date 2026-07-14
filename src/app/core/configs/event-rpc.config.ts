export const EVENT_RPC = {
  getPublicPage: 'get_public_event_page',
  getHostCatalog: 'get_host_event_catalog',

  getCoreList: 'get_admin_event_core_list',
  getCoreDetail: 'get_admin_event_core_detail',
  saveCore: 'save_admin_event_core',
  setCoreActive: 'set_admin_event_core_active',

  getEditionList: 'get_admin_event_list',
  getEditionDetail: 'get_admin_event_detail',
  saveEdition: 'save_admin_event',
  setEditionActive: 'set_admin_event_active',

  saveOccurrence: 'save_admin_event_occurrence',
} as const;
