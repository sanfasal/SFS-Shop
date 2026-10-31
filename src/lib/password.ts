export const PASSWORD_MAX_LENGTH = 100;

// Shown above new-password fields.
export const PASSWORD_HINT =
  "At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.";

// Rules a new password must meet.
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter (A-Z)", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter (a-z)", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number (0-9)", test: (value: string) => /\d/.test(value) },
  { label: "One symbol (e.g. ! @ # $)", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
] as const;

// Returns the first problem with a new password, or null when it's strong enough.
export function passwordProblem(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }
  if (PASSWORD_RULES.some((rule) => !rule.test(value))) {
    return "Password must meet all the requirements above.";
  }
  return null;
}
