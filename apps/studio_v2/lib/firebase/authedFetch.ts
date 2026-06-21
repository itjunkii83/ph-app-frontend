import { auth } from './client';

// fetch with the current user's Firebase ID token attached, for the studio's
// write routes (which verify the token server-side). Reads are open, so they can
// use plain fetch.
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : '';
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
