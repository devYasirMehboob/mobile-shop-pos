import { useEffect, useReducer } from "react";

const STORAGE_KEY = "mobile-shop-pos-cart-v3";
const WHOLE_UNITS = new Set(["piece", "pack", "dozen", "box", "bottle"]);

function tracked(product) {
  return Number(product.track_stock) !== 0;
}

function available(product) {
  return Number(product.quantity) || 0;
}

function normalizeQuantity(product, value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  if (WHOLE_UNITS.has(String(product?.unit_type || "piece").toLowerCase()) && !Number.isInteger(number)) {
    return Math.floor(number) || 1;
  }
  return Math.round(number * 1000) / 1000;
}

function read() {
  try {
    const rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(rows)
      ? rows
          .filter(
            (item) =>
              item &&
              Number.isInteger(Number(item.id)) &&
              normalizeQuantity(item, item.cartQuantity) !== null
          )
          .map((item) => ({
            ...item,
            id: Number(item.id),
            cartQuantity: normalizeQuantity(item, item.cartQuantity),
          }))
      : [];
  } catch {
    return [];
  }
}

function reducer(items, action) {
  switch (action.type) {
    case "add": {
      const existing = items.find((item) => item.id === action.product.id);
      return existing
        ? items.map((item) =>
            item.id === action.product.id
              ? {
                  ...item,
                  cartQuantity:
                    Math.round((item.cartQuantity + action.toAdd) * 1000) / 1000,
                }
              : item
          )
        : [...items, { ...action.product, cartQuantity: action.toAdd }];
    }
    case "quantity":
      return items.map((item) =>
        item.id === action.id ? { ...item, cartQuantity: action.quantity } : item
      );
    case "remove":
      return items.filter((item) => item.id !== action.id);
    case "replace":
      return action.items || [];
    case "clear":
      return [];
    default:
      return items;
  }
}

export default function useCart() {
  const [items, dispatch] = useReducer(reducer, undefined, read);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addProduct(product, quantityToAdd = 1) {
    if (!product) return { ok: false, message: "Invalid product." };
    if (product.status && product.status !== "active") {
      return { ok: false, message: `${product.name} is inactive.` };
    }

    const current = items.find((item) => item.id === product.id)?.cartQuantity || 0;
    const toAdd = quantityToAdd !== null ? normalizeQuantity(product, quantityToAdd) : 1;
    if (toAdd === null || toAdd <= 0) return { ok: false, message: "Invalid quantity." };

    const next = Math.round((current + toAdd) * 1000) / 1000;
    if (tracked(product) && available(product) <= 0) {
      return { ok: false, message: `${product.name} is out of stock.` };
    }
    if (tracked(product) && next > available(product)) {
      return {
        ok: false,
        message: `${product.name} only has ${available(product)} available.`,
      };
    }

    dispatch({ type: "add", product, toAdd });
    return { ok: true, message: `${product.name} added to cart.` };
  }

  function changeQuantity(productOrId, value) {
    const product =
      typeof productOrId === "object"
        ? productOrId
        : items.find((item) => item.id === Number(productOrId));

    if (!product) return { ok: false, message: "Product not found in cart." };

    const next = normalizeQuantity(product, value);
    if (next === null) {
      return {
        ok: false,
        message: WHOLE_UNITS.has(String(product.unit_type || "piece").toLowerCase())
          ? `${product.name} requires a whole-number quantity.`
          : "Quantity must be greater than zero with at most 3 decimals.",
      };
    }

    if (tracked(product) && next > available(product)) {
      return {
        ok: false,
        message: `${product.name} only has ${available(product)} available.`,
      };
    }

    dispatch({ type: "quantity", id: product.id, quantity: next });
    return { ok: true };
  }

  function removeProduct(id) {
    dispatch({ type: "remove", id: Number(id) });
  }

  function clearCart() {
    dispatch({ type: "clear" });
  }

  function replaceCart(next) {
    dispatch({ type: "replace", items: next || [] });
  }

  function revalidate(currentProducts) {
    const map = new Map(currentProducts.map((p) => [Number(p.id), p]));
    const warnings = [];
    const next = [];

    for (const item of items) {
      const current = map.get(Number(item.id));
      if (!current || current.status !== "active") {
        warnings.push(`${item.name} is no longer available and was removed.`);
        continue;
      }
      if (String(current.selling_price) !== String(item.selling_price)) {
        warnings.push(`${item.name} price changed to ${current.selling_price}.`);
      }
      let quantity = item.cartQuantity;
      if (tracked(current) && available(current) <= 0) {
        warnings.push(`${item.name} is out of stock and was removed.`);
        continue;
      }
      if (tracked(current) && quantity > available(current)) {
        quantity = available(current);
        warnings.push(`${item.name} quantity was adjusted to ${quantity}.`);
      }
      next.push({ ...current, cartQuantity: quantity });
    }

    dispatch({ type: "replace", items: next });
    return warnings;
  }

  return {
    items,
    // Method aliases for backward compatibility and clean API
    add: addProduct,
    addProduct,
    setQuantity: changeQuantity,
    changeQuantity,
    remove: removeProduct,
    removeProduct,
    clear: clearCart,
    clearCart,
    replace: replaceCart,
    replaceCart,
    revalidate,
  };
}
