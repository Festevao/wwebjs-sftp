# wwebjs-sftp
A SFTP plugin for whatsapp-web.js (used to "RemoteAuth").

Use the SFTP protocol to keep your WhatsApp MultiDevice session on a SFTP server.

## Quick Links

* [Guide / Getting Started](https://wwebjs.dev/guide/authentication.html) _(work in progress)_
* [GitHub](https://github.com/Festevao/wwebjs-sftp)
* [npm](https://www.npmjs.com/package/wwebjs-sftp)
* [ssh2-sftp-client](https://www.npmjs.com/package/ssh2-sftp-client)

## Installation

The module is now available on npm! `npm i wwebjs-sftp`

## DEBUG mode

To see detailed logs about object health, set the environment variable STORE_DEBUG to "true".

```bash
# linux
$ export STORE_DEBUG=true

# windows
$ SET STORE_DEBUG=true
```

## Example usage

```js
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { SftpStore } = require('wwebjs-sftp');
const SftpClient = require('ssh2-sftp-client');
const sftp = new SftpClient();

sftp.connect({
  host: '<server.example.com>',
  port: '21', // the sftp server service port
  username: '<user name>',
  password: '<user password>'
}).then(() => {
  const store = new SftpStore({ remoteDataPath: '/example/remote/dir', sftp: sftp })
  const client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 150000
    })
  });

  client.initialize();
});
```

## Delete Remote Session

How to force delete a specific remote session on the Database:

```js
await store.delete({session: 'yourSessionName'});
```