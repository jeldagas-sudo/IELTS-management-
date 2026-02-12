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

// Export all data as a JSON-serializable object
export function exportAllData() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    sessions: getSessions(),
  };
}

// Import data from a JSON object
export function importData(data, mode = 'merge') {
  const sessions = data.sessions || data;
  if (!Array.isArray(sessions)) throw new Error('Invalid data format');

  if (mode === 'replace') {
    saveSessions(sessions);
    return { added: sessions.length, skipped: 0 };
  }

  // Merge mode: skip duplicates by id
  const existing = getSessions();
  const existingIds = new Set(existing.map(s => s.id));
  const newSessions = sessions.filter(s => !existingIds.has(s.id));
  saveSessions([...existing, ...newSessions]);
  return { added: newSessions.length, skipped: sessions.length - newSessions.length };
}
