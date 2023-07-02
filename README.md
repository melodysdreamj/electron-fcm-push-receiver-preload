# Electron FCM Push Receiver Library

This library helps your Electron application receive push notifications via Firebase Cloud Messaging (FCM). 

## Usage

### In your main process

Simply import the library and call the setup method:

```javascript
const fcmPushReceiver = require('electron-fcm-push-receiver');

fcmPushReceiver.setup(webContents);
```

### In your renderer process

This library uses the Electron `contextBridge` and `ipcRenderer` for secure communication between the main process and renderer processes.

You must add a `preload.cjs` file to your Electron app to expose these functions:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  sendToMain: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  onFromMain: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});
```

And then, in your renderer process, use the exposed methods to listen for events and send data to the main process:

```javascript
import {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED as ON_NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} from 'electron-fcm-push-receiver/src/constants';

window.electron.onFromMain(NOTIFICATION_SERVICE_STARTED, (token) => {/* do something */});
window.electron.onFromMain(NOTIFICATION_SERVICE_ERROR, (error) => {/* do something */});
window.electron.onFromMain(TOKEN_UPDATED, (token) => {/* do something */});
window.electron.onFromMain(ON_NOTIFICATION_RECEIVED, (notification) => {/* do something */});
window.electron.sendToMain(START_NOTIFICATION_SERVICE, senderId);
```

## Test

After you've set everything up, test your application to ensure that the push notification feature works correctly.

If you encounter any issues or have any questions, please open an issue on this GitHub repository.
