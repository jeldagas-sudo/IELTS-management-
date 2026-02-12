import { useState, useRef } from 'react';
import { Download, Upload, RefreshCw, Sheet, Link2, CheckCircle, AlertCircle, Trash2, Database } from 'lucide-react';
import { getSessions, saveSessions } from '../utils/storage';
import { format } from 'date-fns';
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  syncToGoogleSheets,
  testGoogleSheetsConnection,
  APPS_SCRIPT_TEMPLATE,
} from '../utils/googleSheets';

export default function DataManagement() {
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [sheetsConfig, setSheetsConfig] = useState(getGoogleSheetsConfig());
  const [sheetsStatus, setSheetsStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showScript, setShowScript] = useState(false);

  // ===== JSON BACKUP =====
  const handleExport = () => {
    const sessions = getSessions();
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalSessions: sessions.length,
      sessions,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ielts-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportStatus({ type: 'success', message: `${sessions.length}개 세션 내보내기 완료!` });
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        let sessions;

        if (data.sessions && Array.isArray(data.sessions)) {
          sessions = data.sessions;
        } else if (Array.isArray(data)) {
          sessions = data;
        } else {
          throw new Error('올바른 형식이 아닙니다.');
        }

        // Validate basic structure
        for (const s of sessions) {
          if (!s.type || !s.date) {
            throw new Error('세션 데이터에 필수 필드(type, date)가 누락되었습니다.');
          }
        }

        setImportStatus({
          type: 'preview',
          sessions,
          message: `${sessions.length}개 세션을 발견했습니다.`,
        });
      } catch (err) {
        setImportStatus({ type: 'error', message: `파일 읽기 실패: ${err.message}` });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const confirmImport = (mode) => {
    if (!importStatus?.sessions) return;

    if (mode === 'replace') {
      saveSessions(importStatus.sessions);
      setImportStatus({ type: 'success', message: `${importStatus.sessions.length}개 세션으로 교체 완료!` });
    } else {
      const existing = getSessions();
      const existingIds = new Set(existing.map(s => s.id));
      const newSessions = importStatus.sessions.filter(s => !existingIds.has(s.id));
      saveSessions([...existing, ...newSessions]);
      setImportStatus({
        type: 'success',
        message: `${newSessions.length}개 새 세션 추가 (중복 ${importStatus.sessions.length - newSessions.length}개 제외)`,
      });
    }
    setTimeout(() => setImportStatus(null), 4000);
  };

  const handleClearAll = () => {
    if (window.confirm('정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      if (window.confirm('마지막 확인: 모든 세션 데이터가 영구 삭제됩니다.')) {
        saveSessions([]);
        setImportStatus({ type: 'success', message: '모든 데이터가 삭제되었습니다.' });
        setTimeout(() => setImportStatus(null), 3000);
      }
    }
  };

  // ===== GOOGLE SHEETS =====
  const handleSaveConfig = () => {
    saveGoogleSheetsConfig(sheetsConfig);
    setSheetsStatus({ type: 'success', message: '설정이 저장되었습니다.' });
    setTimeout(() => setSheetsStatus(null), 3000);
  };

  const handleTestConnection = async () => {
    setSyncing(true);
    setSheetsStatus({ type: 'info', message: '연결 테스트 중...' });
    const result = await testGoogleSheetsConnection(sheetsConfig.webAppUrl);
    setSheetsStatus(result.success
      ? { type: 'success', message: '연결 성공! Google Sheets와 정상적으로 통신됩니다.' }
      : { type: 'error', message: `연결 실패: ${result.error}` }
    );
    setSyncing(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSheetsStatus({ type: 'info', message: '동기화 중...' });
    const sessions = getSessions();
    const result = await syncToGoogleSheets(sheetsConfig.webAppUrl, sessions);
    setSheetsStatus(result.success
      ? { type: 'success', message: `${sessions.length}개 세션 동기화 완료!` }
      : { type: 'error', message: `동기화 실패: ${result.error}` }
    );
    setSyncing(false);
  };

  const sessionCount = getSessions().length;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Database size={28} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold">데이터 관리</h1>
          <p className="text-sm text-text-secondary">백업, 복원, Google Sheets 연동</p>
        </div>
      </div>

      {/* Current Data Stats */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">현재 저장된 데이터</p>
          <p className="text-2xl font-bold text-primary">{sessionCount}개 세션</p>
        </div>
        <div className="text-sm text-text-secondary">
          localStorage 사용
        </div>
      </div>

      {/* ===== Level 1: JSON Backup/Restore ===== */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">Level 1</div>
          <h2 className="font-semibold text-lg">JSON 백업 / 복원</h2>
        </div>
        <p className="text-sm text-text-secondary">
          서버 없이도 데이터를 파일로 저장하고 불러올 수 있습니다. 브라우저 데이터가 날아가도 안전합니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-primary text-white py-3 px-4 rounded-xl font-medium active:opacity-90 transition-colors cursor-pointer border-none"
          >
            <Download size={18} />
            JSON 내보내기
          </button>

          {/* Import */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-card border-2 border-dashed border-primary/40 text-primary py-3 px-4 rounded-xl font-medium active:bg-primary/5 transition-colors cursor-pointer"
          >
            <Upload size={18} />
            JSON 불러오기
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Export Status */}
        {exportStatus && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            exportStatus.type === 'success' ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
          }`}>
            <CheckCircle size={16} />
            {exportStatus.message}
          </div>
        )}

        {/* Import Preview */}
        {importStatus?.type === 'preview' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-amber-800">
              {importStatus.message}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => confirmImport('merge')}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none active:opacity-90"
              >
                기존 데이터에 합치기
              </button>
              <button
                type="button"
                onClick={() => confirmImport('replace')}
                className="flex-1 bg-danger text-white py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none active:opacity-90"
              >
                전체 교체
              </button>
              <button
                type="button"
                onClick={() => setImportStatus(null)}
                className="px-4 bg-gray-200 text-text py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none active:opacity-90"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* Import Status */}
        {importStatus && importStatus.type !== 'preview' && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            importStatus.type === 'success' ? 'bg-green-50 text-success' :
            importStatus.type === 'error' ? 'bg-red-50 text-danger' : ''
          }`}>
            {importStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {importStatus.message}
          </div>
        )}

        {/* Danger Zone */}
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-2 text-danger text-sm font-medium cursor-pointer bg-transparent border-none p-0 hover:underline"
          >
            <Trash2 size={14} />
            모든 데이터 삭제
          </button>
        </div>
      </div>

      {/* ===== Level 2: Google Sheets ===== */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-success/10 text-success text-xs font-bold px-2 py-1 rounded">Level 2</div>
          <h2 className="font-semibold text-lg">Google Sheets 연동</h2>
        </div>
        <p className="text-sm text-text-secondary">
          데이터를 구글 시트에 자동으로 보내서, 엑셀/파이썬으로 심층 분석할 수 있습니다.
        </p>

        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-blue-800">설정 방법 (1회만)</p>
          <ol className="text-xs text-blue-700 space-y-1.5 list-decimal pl-4">
            <li>Google Sheets에서 새 스프레드시트를 만드세요</li>
            <li>상단 메뉴 → <strong>확장 프로그램</strong> → <strong>Apps Script</strong> 클릭</li>
            <li>아래 스크립트를 복사하여 붙여넣기 후 저장</li>
            <li><strong>배포</strong> → <strong>새 배포</strong> → 유형: <strong>웹 앱</strong> 선택</li>
            <li>액세스: <strong>모든 사용자</strong>로 설정 후 배포</li>
            <li>생성된 <strong>웹 앱 URL</strong>을 아래에 붙여넣기</li>
          </ol>
          <button
            type="button"
            onClick={() => setShowScript(!showScript)}
            className="flex items-center gap-1 text-xs text-blue-700 font-medium mt-2 cursor-pointer bg-transparent border-none p-0 hover:underline"
          >
            {showScript ? '스크립트 숨기기' : 'Apps Script 코드 보기'}
          </button>
          {showScript && (
            <div className="mt-2 relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre max-h-72 overflow-y-auto">
                {APPS_SCRIPT_TEMPLATE}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
                  setSheetsStatus({ type: 'success', message: '스크립트가 클립보드에 복사되었습니다!' });
                  setTimeout(() => setSheetsStatus(null), 2000);
                }}
                className="absolute top-2 right-2 bg-white/20 text-white px-3 py-1.5 rounded text-xs cursor-pointer border-none active:bg-white/30"
              >
                복사
              </button>
            </div>
          )}
        </div>

        {/* Config */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              <Link2 size={14} className="inline mr-1" />
              Web App URL
            </label>
            <input
              type="url"
              value={sheetsConfig.webAppUrl}
              onChange={(e) => setSheetsConfig(prev => ({ ...prev, webAppUrl: e.target.value }))}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none active:opacity-90"
            >
              설정 저장
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={!sheetsConfig.webAppUrl || syncing}
              className="flex items-center gap-1.5 bg-card border border-border text-text px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100"
            >
              <Link2 size={14} />
              연결 테스트
            </button>
          </div>
        </div>

        {/* Sync Button */}
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={handleSync}
            disabled={!sheetsConfig.webAppUrl || syncing}
            className="w-full flex items-center justify-center gap-2 bg-success text-white py-3 rounded-xl font-medium cursor-pointer border-none active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Sheet size={18} />
            )}
            {syncing ? '동기화 중...' : `Google Sheets로 동기화 (${sessionCount}개 세션)`}
          </button>
        </div>

        {/* Sheets Status */}
        {sheetsStatus && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            sheetsStatus.type === 'success' ? 'bg-green-50 text-success' :
            sheetsStatus.type === 'error' ? 'bg-red-50 text-danger' :
            'bg-blue-50 text-blue-700'
          }`}>
            {sheetsStatus.type === 'success' ? <CheckCircle size={16} /> :
             sheetsStatus.type === 'error' ? <AlertCircle size={16} /> :
             <RefreshCw size={16} className="animate-spin" />}
            {sheetsStatus.message}
          </div>
        )}
      </div>
    </div>
  );
}
