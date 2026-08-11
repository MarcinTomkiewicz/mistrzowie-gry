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

export function commercialFieldsForProduct(
  fields: readonly CommercialProductField[],
  productId: string,
): CommercialProductField[] {
  return fields.filter((field) => field.productIds.includes(productId));
}

export function commercialProductFieldLabel(
  field: CommercialProductField,
  productId: string,
): string {
  return field.labelOverrides[productId] ?? field.label;
}

export function isCommercialProductFieldVisible(
  field: CommercialProductField,
  productId: string,
): boolean {
  return field.productIds.includes(productId);
}
