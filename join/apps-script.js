// Google Apps Script: paste into a NEW Google Sheet's Apps Script editor
// Sheet should have one tab called "Early Signups" with headers:
// Timestamp | Name | Phone | Year | Status

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.type === 'early-signup') {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Early Signups');
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Early Signups');
        sheet.appendRow(['Timestamp', 'Name', 'Phone', 'Year', 'Status']);
      }
      sheet.appendRow([
        new Date().toLocaleString(),
        data.name || '',
        data.phone || '',
        data.year || '',
        data.status || ''
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
