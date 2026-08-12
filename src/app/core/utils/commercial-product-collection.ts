import type {
  CommercialProductField,
  CommercialRenderProduct,
} from '../types/commercial-page-builder';

export function selectCommercialProducts(
  productIds: readonly string[],
  products: readonly CommercialRenderProduct[],
): CommercialRenderProduct[] {
  const productsById = new Map(
    products.map((product) => [product.id, product] as const),
  );

  return productIds.map((productId) => {
    const product = productsById.get(productId);

    if (!product) {
      throw new TypeError(
        `Missing page-local commercial product: ${productId}`,
      );
    }

    return product;
  });
}

export function selectCommercialProductFields(
  fieldIds: readonly string[],
  fields: readonly CommercialProductField[],
): CommercialProductField[] {
  const fieldsById = new Map(
    fields.map((field) => [field.id, field] as const),
  );

  return fieldIds.map((fieldId) => {
    const field = fieldsById.get(fieldId);

    if (!field) {
      throw new TypeError(`Missing commercial product field: ${fieldId}`);
    }

    return field;
  });
}

export function commercialFieldsForProduct(
  fields: readonly CommercialProductField[],
  productId: string,
): CommercialProductField[] {
  return fields.filter((field) =>
    field.productIds === null || field.productIds.includes(productId)
  );
}

export function commercialProductFieldLabel(
  field: CommercialProductField,
  productId: string,
  defaultLabel: string,
): string {
  return field.labelOverrides.find(
    (override) => override.productId === productId,
  )?.label ?? field.label ?? defaultLabel;
}

export function isCommercialProductFieldVisible(
  field: CommercialProductField,
  productId: string,
): boolean {
  return field.productIds === null || field.productIds.includes(productId);
}
