export function withErrorReference(message: string, reference?: string) {
  return reference ? `${message} Reference: ${reference}` : message;
}
