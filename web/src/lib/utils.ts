export function cn(...inputs: Array<string | undefined | null | boolean>) {
  return inputs.filter(Boolean).join(" ");
}