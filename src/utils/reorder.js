// Turning a past order's line items back into cart items.
//
// Order items come off the API flat (productId / variantWeight / variantPrice),
// NOT as the nested { product, variant } shape the cart's addItem expects, so
// every "buy again" path has to map between the two. Keeping that mapping here
// means the Orders page and the home Buy Again row cannot drift apart.

// Bundle lines (hampers, combos) are priced as a set and cannot be re-added as
// loose items, so they are skipped.
export const reorderableItems = (order) =>
  (order?.items || []).filter((item) => !item.bundleId && item.productId && item.variantWeight);

export const orderItemToProduct = (item) => ({
  _id: item.productId,
  name: item.product?.name || item.name,
  thumbnail: item.product?.thumbnail || item.image || item.product?.images?.[0],
  slug: item.product?.slug,
  isVeg: item.product?.isVeg,
});

export const orderItemToVariant = (item) => ({
  weight: item.variantWeight,
  price: Number(item.variantPrice) || 0,
  mrp: Number(item.variantPrice) || 0,
});

// Adds every re-orderable line of `order` to the cart. Returns how many went in.
export const addOrderToCart = (order, addItem) => {
  const items = reorderableItems(order);
  items.forEach((item) => {
    addItem(orderItemToProduct(item), orderItemToVariant(item), Math.max(1, Number(item.quantity) || 1));
  });
  return items.length;
};
