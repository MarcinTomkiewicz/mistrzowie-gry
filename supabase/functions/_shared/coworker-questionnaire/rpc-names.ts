export const RPC = {
  getAdminEnvelope: "get_admin_coworker_questionnaire_envelope",
  getEnvelope: "get_coworker_questionnaire_envelope",
  getStatement: "get_coworker_questionnaire_statement",
  saveEnvelope: "save_coworker_questionnaire_envelope",
} as const;

export type RpcName = typeof RPC[keyof typeof RPC];
