const CONFIG_KEY = 'ielts-google-sheets-config';

export function getGoogleSheetsConfig() {
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : { webAppUrl: '' };
  } catch {
    return { webAppUrl: '' };
  }
}

export function saveGoogleSheetsConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function testGoogleSheetsConnection(webAppUrl) {
  if (!webAppUrl) return { success: false, error: 'URL이 설정되지 않았습니다.' };

  try {
    await fetch(webAppUrl + '?action=ping', {
      method: 'GET',
      mode: 'no-cors',
    });
    // no-cors always returns opaque response, so we can't check status
    // Instead try a POST with ping action
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'ping' }),
    });
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: `HTTP ${res.status}` };
  } catch (err) {
    // For no-cors, the request might succeed but we can't read the response.
    // If it's a CORS issue, suggest the user check their Apps Script deployment.
    return { success: false, error: err.message || '연결 실패. Web App URL과 배포 설정을 확인하세요.' };
  }
}

export async function syncToGoogleSheets(webAppUrl, sessions) {
  if (!webAppUrl) return { success: false, error: 'URL이 설정되지 않았습니다.' };

  try {
    const payload = {
      action: 'sync',
      sessions: sessions.map(s => ({
        id: s.id,
        date: s.date,
        type: s.type,
        source: s.source || '',
        section: s.section || '',
        totalQuestions: s.totalQuestions,
        wrongAnswers: s.wrongAnswers,
        correctAnswers: s.totalQuestions - s.wrongAnswers,
        bandScore: s.bandScore,
        notes: s.notes || '',
        errorCount: s.errors?.length || 0,
        errorCategories: (s.errors || [])
          .map(e => e.category)
          .filter(Boolean)
          .join(', '),
        errorQuestionTypes: (s.errors || [])
          .map(e => e.questionType)
          .filter(Boolean)
          .join(', '),
        passages: s.passages ? JSON.stringify(s.passages) : '',
        createdAt: s.createdAt || '',
      })),
    };

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    }
    return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
  } catch (err) {
    return { success: false, error: err.message || '동기화 실패. 네트워크와 URL을 확인하세요.' };
  }
}

// Google Apps Script template for users to deploy
export const APPS_SCRIPT_TEMPLATE = `// IELTS Tracker - Google Sheets Sync
// 이 코드를 Apps Script에 붙여넣고 웹 앱으로 배포하세요.

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'ping') {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'sync') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Sessions') || ss.insertSheet('Sessions');

      // 헤더 설정 (첫 행)
      var headers = [
        'ID', 'Date', 'Type', 'Source', 'Section',
        'Total Questions', 'Wrong Answers', 'Correct Answers',
        'Band Score', 'Notes', 'Error Count',
        'Error Categories', 'Error Question Types',
        'Passages', 'Created At', 'Synced At'
      ];

      // 첫 행에 헤더가 없으면 추가
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
        // 헤더 스타일
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#375a7f');
        headerRange.setFontColor('#ffffff');
        sheet.setFrozenRows(1);
      }

      // 기존 ID 목록 가져오기 (중복 방지)
      var existingIds = new Set();
      if (sheet.getLastRow() > 1) {
        var idRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1);
        var idValues = idRange.getValues();
        idValues.forEach(function(row) {
          existingIds.add(String(row[0]));
        });
      }

      var newRows = 0;
      var updatedRows = 0;
      var syncTime = new Date().toISOString();

      data.sessions.forEach(function(session) {
        var row = [
          session.id,
          session.date,
          session.type,
          session.source,
          session.section,
          session.totalQuestions,
          session.wrongAnswers,
          session.correctAnswers,
          session.bandScore,
          session.notes,
          session.errorCount,
          session.errorCategories,
          session.errorQuestionTypes,
          session.passages,
          session.createdAt,
          syncTime
        ];

        if (existingIds.has(String(session.id))) {
          // 기존 데이터 업데이트
          var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1);
          var values = dataRange.getValues();
          for (var i = 0; i < values.length; i++) {
            if (String(values[i][0]) === String(session.id)) {
              sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
              updatedRows++;
              break;
            }
          }
        } else {
          sheet.appendRow(row);
          newRows++;
        }
      });

      // 열 너비 자동 조정
      sheet.autoResizeColumns(1, headers.length);

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'ok',
          newRows: newRows,
          updatedRows: updatedRows,
          totalRows: sheet.getLastRow() - 1
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'IELTS Tracker API' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
