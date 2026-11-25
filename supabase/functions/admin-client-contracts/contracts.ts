export const CLIENT_CONTRACTS_BUCKET = "client-contracts";
export const CLIENT_CONTRACT_PDF_MAX_BYTES = 26_214_400;

export const TEMPLATE_FAMILIES = [
  "ddd",
  "parent_school",
  "institution",
] as const;
export const PARTY_KINDS = ["individual", "institution"] as const;
export const LINK_KINDS = [
  "none",
  "session_reservation",
  "customer_entitlement",
  "staffing_realization",
] as const;
export const ARTIFACT_TYPES = [
  "template",
  "active_template",
  "agreement",
] as const;

type TemplateFamily = typeof TEMPLATE_FAMILIES[number];
type PartyKind = typeof PARTY_KINDS[number];
type LinkKind = typeof LINK_KINDS[number];
export type ArtifactType = typeof ARTIFACT_TYPES[number];

export const RPC = {
  registerTemplate: "register_admin_contract_template",
  approveTemplate: "approve_admin_contract_template",
  listTemplates: "list_admin_contract_templates",
  deleteTemplate: "delete_admin_contract_template",
  registerAgreement: "register_admin_client_contract",
  listAgreements: "list_admin_client_contracts",
  getFile: "get_admin_contract_file",
} as const;

type PdfMetadata = {
  pdf_sha256: string;
  size_bytes: number;
};

type StoredPdfArgs = {
  p_storage_path: string;
  p_pdf_sha256: string;
  p_size_bytes: number;
  p_original_filename: string;
};

type TemplateState = {
  template_id: string;
  family: TemplateFamily;
  status: "staged" | "active" | "retired";
};

type TemplateRow = TemplateState & PdfMetadata & {
  original_filename: string;
  created_at: string;
  approved_at: string | null;
  can_delete: boolean;
};

export type ContractFileLocation = {
  template_id: string;
  bucket_id: string;
  storage_path: string;
};

type AgreementRegistration = {
  document_id: string;
  template_id: string;
  created_at: string;
};

type AgreementRow = AgreementRegistration & PdfMetadata & {
  template_family: TemplateFamily;
  party_kind: PartyKind;
  party_label: string;
  party_email: string | null;
  link_kind: LinkKind;
  link_id: string | null;
};

type Rpc<Args, Row> = { Args: Args; Returns: Row[] };

export type ClientContractsDatabase = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      [RPC.registerTemplate]: Rpc<
        StoredPdfArgs & { p_family: TemplateFamily },
        TemplateState
      >;
      [RPC.approveTemplate]: Rpc<
        { p_template_id: string },
        TemplateState
      >;
      [RPC.listTemplates]: Rpc<never, TemplateRow>;
      [RPC.deleteTemplate]: Rpc<
        { p_template_id: string; p_confirm_active: boolean },
        ContractFileLocation & { already_deleted: boolean }
      >;
      [RPC.registerAgreement]: Rpc<
        StoredPdfArgs & {
          p_template_id: string;
          p_party_kind: PartyKind;
          p_party_label: string;
          p_party_email: string | null;
          p_link_kind: LinkKind;
          p_link_id: string | null;
        },
        AgreementRegistration
      >;
      [RPC.listAgreements]: Rpc<never, AgreementRow>;
      [RPC.getFile]: Rpc<
        { p_artifact_type: ArtifactType; p_artifact_id: string },
        ContractFileLocation & PdfMetadata & { original_filename: string }
      >;
    };
  };
};
