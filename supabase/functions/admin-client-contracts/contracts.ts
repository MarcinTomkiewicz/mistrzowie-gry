import type {
  ConfigurationMode,
  ContractPage,
  ContractTemplateConfiguration,
} from "../../../src/app/core/types/contract-template-configuration.ts";

export const CLIENT_CONTRACTS_BUCKET = "client-contracts";
export const CLIENT_CONTRACT_PDF_MAX_BYTES = 26_214_400;

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

type PartyKind = typeof PARTY_KINDS[number];
type LinkKind = typeof LINK_KINDS[number];
export type ArtifactType = typeof ARTIFACT_TYPES[number];

export const RPC = {
  listFamilies: "list_admin_contract_families",
  createFamily: "create_admin_contract_family",
  renameFamily: "rename_admin_contract_family",
  getTemplateConfiguration: "get_admin_contract_template_configuration",
  saveTemplateConfiguration: "save_admin_contract_template_configuration",
  copyTemplateConfiguration: "copy_admin_contract_template_configuration",
  reassignTemplate: "reassign_admin_contract_template",
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
  family: string;
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
  template_family: string;
  party_kind: PartyKind;
  party_label: string;
  party_email: string | null;
  link_kind: LinkKind;
  link_id: string | null;
};

type Rpc<Args, Row> = { Args: Args; Returns: Row[] };

type FamilyRow = { family: string; label: string; created_at: string };
type ConfigurationRow = TemplateState & {
  pdf_sha256: string;
  configuration_revision: number;
  configuration: ContractTemplateConfiguration | null;
  configuration_updated_at: string | null;
};
type RevisionArgs = {
  p_template_id: string;
  p_pdf_sha256: string;
  p_expected_revision: number;
};

export type ClientContractsDatabase = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      [RPC.listFamilies]: Rpc<never, FamilyRow>;
      [RPC.createFamily]: Rpc<{ p_family: string; p_label: string }, FamilyRow>;
      [RPC.renameFamily]: Rpc<
        { p_family: string; p_expected_label: string; p_label: string },
        FamilyRow
      >;
      [RPC.getTemplateConfiguration]: Rpc<
        { p_template_id: string; p_mode: ConfigurationMode },
        ConfigurationRow
      >;
      [RPC.saveTemplateConfiguration]: Rpc<
        RevisionArgs & { p_configuration: ContractTemplateConfiguration },
        ConfigurationRow
      >;
      [RPC.copyTemplateConfiguration]: Rpc<
        RevisionArgs & {
          p_source_template_id: string;
          p_source_revision: number;
          p_pages: ContractPage[];
        },
        ConfigurationRow
      >;
      [RPC.reassignTemplate]: Rpc<
        RevisionArgs & { p_expected_family: string; p_target_family: string },
        ConfigurationRow
      >;
      [RPC.registerTemplate]: Rpc<
        StoredPdfArgs & { p_family: string },
        TemplateState
      >;
      [RPC.approveTemplate]: Rpc<
        RevisionArgs & { p_confirm_preview: boolean },
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
