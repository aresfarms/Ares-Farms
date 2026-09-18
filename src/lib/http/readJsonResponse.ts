/**
 * Read a JSON API response without leaking the browser's low-level parser
 * error into operator-facing UI. Empty or non-JSON upstream responses still
 * retain their HTTP status for diagnosis.
 */
export async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();

  if (!body.trim()) {
    throw new Error(
      `The service returned an empty response (HTTP ${response.status}). Please retry; if the problem continues, contact platform operations.`
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(
      `The service returned an unreadable response (HTTP ${response.status}). Please retry; if the problem continues, contact platform operations.`
    );
  }
}
