import axios from "axios";

// Turns an API failure into a message worth showing: ASP.NET validation
// errors, plain-text bodies, { error } bodies, or an auth hint.
export function errorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Couldn't reach the API. Is it running?";
    const data = err.response.data;
    if (typeof data === "string" && data) return data;
    if (data && typeof data === "object") {
      const { title, error, errors } = data as {
        title?: string;
        error?: string;
        errors?: Record<string, string[]>;
      };
      const first = errors && Object.values(errors).flat()[0];
      if (first) return first;
      if (error) return error;
      if (title) return title;
    }
    if (err.response.status === 401 || err.response.status === 403) {
      return "You're not allowed to do this. Try logging in again.";
    }
  } else if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}
