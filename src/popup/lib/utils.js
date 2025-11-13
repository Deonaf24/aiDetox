import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const hasChrome = typeof chrome !== "undefined" && !!chrome;

export function withChrome(callback, fallback) {
  if (hasChrome) {
    return callback(chrome);
  }
  return fallback;
}
