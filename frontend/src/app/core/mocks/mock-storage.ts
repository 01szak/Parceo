/*
 * MOCK: storage for data the backend does not provide yet (see "Mocki we frontendzie" in PLAN.md).
 * Everything is kept in localStorage of this browser only.
 */
const PREFIX = 'parceo.mock.';

export function readMock<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeMock<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    //storage blocked (private mode): the value lives until the page is reloaded
  }
}
