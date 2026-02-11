const STORAGE_KEY = 'ielts-tracker-sessions';

export function getSessions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function addSession(session) {
  const sessions = getSessions();
  const newSession = {
    ...session,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  sessions.push(newSession);
  saveSessions(sessions);
  return newSession;
}

export function updateSession(id, updates) {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates };
    saveSessions(sessions);
    return sessions[index];
  }
  return null;
}

export function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id);
  saveSessions(sessions);
}

export function getSessionsByType(type) {
  return getSessions().filter(s => s.type === type);
}

export function getSessionsSorted() {
  return getSessions().sort((a, b) => new Date(a.date) - new Date(b.date));
}
