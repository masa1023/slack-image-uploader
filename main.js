var slackAccessToken = 'YOUR SLACK ACCESS TOEKN'
var CHANNEL_ID = 'TARGET CHANNEL ID'
var GOOGLE_DRIVE_FOLDER_ID = 'GOOGLE_DRIVE_FOLDER_ID'
var SHEET_ID = 'SPEADSHEET_ID'

function uploadImage() {
  var spreadSheet = SpreadsheetApp.openById(SHEET_ID)
  var sheet = spreadSheet.getSheetByName('sheet1')
  var lastUploadedImageID = sheet.getRange(1, 1).getValue()

  var fileResponse = UrlFetchApp.fetch(
    'https://slack.com/api/files.list?token=' +
      slackAccessToken +
      '&channel=' +
      CHANNEL_ID +
      '&pretty=1'
  )
  var fileInfo = JSON.parse(fileResponse.getContentText())
  var lastFileID = null
  var lastUploadedImageFound = false

  files = fileInfo.files.sort(compare)
  for (i = 0; i < files.length; i++) {
    file = files[i]

    // すでにGoogleDriveに保存済みの画像が見つかるまでスキップ
    if (file.id == lastUploadedImageID) {
      console.log(lastUploadedImageID)
      lastUploadedImageFound = true
      continue
    }
    if (!lastUploadedImageFound) {
      continue
    }

    // Google Driveのリンクなら無視
    if (file.external_type == 'gdrive') {
      console.log(file.id + ' is GoogleDrive file')
      continue
    }

    // 50MB以上なら終了(GASは50MB以上のファイルを一度に扱えない)
    if (file.size > 50000000) {
      console.log(file.id + ' is over 50MB')
      continue
    }

    // ダウンロード用URL
    var dlUrl = file.url_private
    // ファイル形式取得可 var fileType = file.filetype
    var headers = {
      Authorization: 'Bearer ' + slackAccessToken,
    }
    var option = {
      method: 'GET',
      headers: headers,
    }
    var dlData = UrlFetchApp.fetch(dlUrl, option).getBlob()

    targetFolder = DriveApp.getFolderById(GOOGLE_DRIVE_FOLDER_ID)
    uploadedFile = targetFolder.createFile(dlData)
    uploadedFile.setName(file.title + '(' + file.id + ')')

    lastFileID = file.id
    console.log(lastFileID + ' was uploaded')
  }
  if (lastFileID) {
    sheet.getRange(1, 1).setValue(lastFileID)
  }
}

function compare(a, b) {
  if (a.created < b.created) return -1
  if (a.created > b.created) return 1
  return 0
}
