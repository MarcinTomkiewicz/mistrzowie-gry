export const RPC = {
  cancelDocumentUpload: "cancel_coworker_document_upload",
  finalizeDocumentUpload: "finalize_coworker_document_upload",
  getAdminEnvelope: "get_admin_coworker_questionnaire_envelope",
  getEnvelope: "get_coworker_questionnaire_envelope",
  getStatement: "get_coworker_questionnaire_statement",
  recordDocumentCleanup: "record_coworker_document_storage_cleanup_result",
  reserveQuestionnaireDocument:
    "reserve_coworker_questionnaire_document_generation",
  saveEnvelope: "save_coworker_questionnaire_envelope",
} as const;

export type RpcName = typeof RPC[keyof typeof RPC];
