export type CommercialConstantValueType = 'duration' | 'integer' | 'text';
export type CommercialConstantValue = string | number;

export type CommercialConstantUsage = {
  used: boolean;
  draftPageCount: number;
  publishedPageCount: number;
};

type CommercialConstantAdminItemBase<
  TValueType extends CommercialConstantValueType,
  TValue extends CommercialConstantValue,
> = {
  id: string;
  token: string;
  syntax: string;
  label: string;
  valueType: TValueType;
  draftValue: TValue;
  publishedValue: TValue | null;
  hasDraftChanges: boolean;
  isPublished: boolean;
  draftUpdatedAt: string;
  draftUpdatedBy: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  usage: CommercialConstantUsage;
  canChangeIdentity: boolean;
  canDelete: boolean;
};

export type CommercialConstantAdminItem =
  | CommercialConstantAdminItemBase<'duration', number>
  | CommercialConstantAdminItemBase<'integer', number>
  | CommercialConstantAdminItemBase<'text', string>;

export type CommercialConstantSavePayload =
  | {
      token: string;
      label: string;
      valueType: 'duration' | 'integer';
      draftValue: number;
    }
  | {
      token: string;
      label: string;
      valueType: 'text';
      draftValue: string;
    };

export type CommercialConstantSaveRpcPayload = {
  p_constant_id: string | null;
  p_payload: CommercialConstantSavePayload;
};

export type CommercialConstantIdRpcPayload = {
  p_constant_id: string;
};

export type CommercialConstantsPublishRpcPayload = {
  p_constant_ids: string[];
};
