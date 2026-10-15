export const EVENT_RPC = {
  getPublicPage: 'get_public_event_page',
  getPublicCatalog: 'get_public_event_catalog',
  getPublicProgram: 'get_public_event_program',
  getPublicGmProfile: 'get_public_event_gm_profile',
  getHostCatalog: 'get_host_event_catalog',

  registerParticipant: 'register_event_participant',
  getMyParticipant: 'get_my_event_participant',
  cancelMyParticipant: 'cancel_my_event_participant',

  getCoreList: 'get_admin_event_core_list',
  getCoreDetail: 'get_admin_event_core_detail',
  saveCore: 'save_admin_event_core',
  setCoreActive: 'set_admin_event_core_active',

  getEditionList: 'get_admin_event_list',
  getEditionDetail: 'get_admin_event_detail',
  publishStaffingEvent: 'publish_admin_staffing_event',
  reconcileStaffingEventProgram: 'reconcile_admin_staffing_event_program',
  saveEdition: 'save_admin_event',
  setEditionActive: 'set_admin_event_active',

  saveOccurrence: 'save_admin_event_occurrence',
} as const;
