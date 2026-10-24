import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { safeNextPath } from "./redirect";
export { formatBytes, formatDate, formatRelativeTime, initials } from "./format";
