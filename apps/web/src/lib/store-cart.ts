import { quotePosters } from "./store-pricing";

const KEY = "reviewsgo-cart";
export const CART_EVENT = "reviewsgo-cart";

export function readCartQuantity() {
  if (typeof window === "undefined") return 0;
  const quantity = Number(window.localStorage.getItem(KEY));
  return quotePosters(quantity) ? quantity : 0;
}

export function writeCartQuantity(quantity: number) {
  if (typeof window === "undefined") return 0;
  const quote = quotePosters(quantity);
  if (!quote) {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(CART_EVENT));
    return 0;
  }
  window.localStorage.setItem(KEY, String(quote.quantity));
  window.dispatchEvent(new Event(CART_EVENT));
  return quote.quantity;
}

export function addPackQuantity(packQuantity: number) {
  const next = Math.min(100, readCartQuantity() + packQuantity);
  return writeCartQuantity(next);
}

export function clearCart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(CART_EVENT));
}
