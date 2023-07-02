const { register, listen } = require('push-receiver');
const { ipcMain, webContents } = require('electron');
const Config = require('electron-config');
const {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} = require('./constants');

const config = new Config();

module.exports = {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
  setup,
  reset,
};

let started = false;

function sendToPreload(event, arg) {
  // 주의: webContents.getAllWebContents() 는 모든 webContents를 반환합니다. 여기서 필요한 것은 단지 전달하려는 특정 webContents입니다.
  webContents.getAllWebContents().forEach(wc => {
    wc.send(event, arg);
  });
}

function setup(webContents) {
  ipcMain.on(START_NOTIFICATION_SERVICE, async (_, senderId) => {
    let credentials = config.get('credentials');
    const savedSenderId = config.get('senderId');
    if (started) {
      sendToPreload(NOTIFICATION_SERVICE_STARTED, ((credentials && credentials.fcm) || {}).token);
      return;
    }
    started = true;
    try {
      const persistentIds = config.get('persistentIds') || [];
      if (!credentials || savedSenderId !== senderId) {
        credentials = await register(senderId);
        config.set('credentials', credentials);
        config.set('senderId', senderId);
        sendToPreload(TOKEN_UPDATED, credentials.fcm.token);
      }
      await listen(Object.assign({}, credentials, { persistentIds }), onNotification(webContents));
      sendToPreload(NOTIFICATION_SERVICE_STARTED, credentials.fcm.token);
    } catch (e) {
      console.error('PUSH_RECEIVER:::Error while starting the service', e);
      sendToPreload(NOTIFICATION_SERVICE_ERROR, e.message);
    }
  });
}

function reset() {
  config.set('credentials', null);
  config.set('senderId', null);
  config.set('persistentIds', null);
  started = false;
}

function onNotification(webContents) {
  return ({ notification, persistentId }) => {
    const persistentIds = config.get('persistentIds') || [];
    config.set('persistentIds', [...persistentIds, persistentId]);
    if(!webContents.isDestroyed()){
      sendToPreload(NOTIFICATION_RECEIVED, notification);
    }
  };
}
