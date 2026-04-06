const ADMIN_PIN = "1234"; 

function doGet() {
  // app.htmlを読み込み、外部サイトからの埋め込みを許可する
  return HtmlService.createTemplateFromFile('app').evaluate()
    .setTitle('深夜シフト管理 - NEON')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getMembers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) return ["メンバー未登録"];
  return sheet.getRange(1, 1, lastRow, 1).getValues().flat().filter(String);
}

function getEvents() {
  const cal = CalendarApp.getDefaultCalendar();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  
  return cal.getEvents(start, end).map(e => {
    const title = e.getTitle();
    const isConfirmed = title.includes('★確定');
    return {
      id: e.getId(),
      title: title,
      start: e.getStartTime().toISOString(),
      end: e.getEndTime().toISOString(),
      backgroundColor: isConfirmed ? '#ff003c' : 'rgba(40, 40, 40, 0.6)',
      borderColor: '#ff003c',
      textColor: isConfirmed ? '#fff' : '#aaa',
      extendedProps: { isConfirmed: isConfirmed }
    };
  });
}

function createShiftEvent(dateIsoString, startTime, endTime, userName) {
  const cal = CalendarApp.getDefaultCalendar();
  const date = new Date(dateIsoString);
  const start = new Date(date);
  const [sH, sM] = startTime.split(':');
  start.setHours(parseInt(sH), parseInt(sM), 0);
  const end = new Date(date);
  let displayEnd = endTime;
  if (endTime === "最終まで") {
    end.setDate(end.getDate() + 1);
    end.setHours(5, 0, 0);
    displayEnd = "最終";
  } else {
    const [eH, eM] = endTime.split(':');
    const hour = parseInt(eH);
    if (hour <= 5) end.setDate(end.getDate() + 1);
    end.setHours(hour, parseInt(eM), 0);
  }
  cal.createEvent(`【${userName}】${startTime}-${displayEnd}`, start, end);
  return true;
}

function confirmEvent(eventId, pin) {
  if (pin !== ADMIN_PIN) throw new Error("暗証番号が正しくありません");
  const event = CalendarApp.getEventById(eventId);
  if (!event) throw new Error("対象が見つかりません");
  let title = event.getTitle();
  if (!title.includes('★確定')) event.setTitle(title + " ★確定");
  return true;
}

function deleteEvent(eventId) {
  const event = CalendarApp.getEventById(eventId);
  if (event) event.deleteEvent();
  return true;
}
