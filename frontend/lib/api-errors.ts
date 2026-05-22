import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Cannot reach the API server. Is the backend running on http://127.0.0.1:8000?";
    }
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg ?? JSON.stringify(d)).join(", ");
    }
    return error.response.statusText || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
