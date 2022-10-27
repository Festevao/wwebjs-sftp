const DEBUG = (process.env.STORE_DEBUG === 'true' ? true : false);
const path = require('path');
const fs = require('fs');
const cleanStringify = (DEBUG ? require('./cleanStringify.js') : function () { });

class SftpStore {
  /**
   * @example
   * const SftpClient = require('ssh2-sftp-client');
   * const sftp = new SftpClient();
   * new SftpStore({ remoteDataPath: '/example/remote/addr', sftp: sftp })
   * @param {Object} options Specifies the params pattern.
   * @param {String} options.remoteDataPath Specifies the remote path to save authentication files.
   * @param {Object} options.sftp The sftp connection instace after connected.
   */
  constructor({ remoteDataPath, sftp } = {}) {
    if (!remoteDataPath) throw new Error("A valid remote dir path is required for SftpStore (try '/').");
    if (!sftp) throw new Error('A valid sftp instance (from ssh2-sftp-client) is required for SftpStore.');
    sftp.exists(remoteDataPath)
      .then(data => {
        if (data !== 'd') throw new Error(`Can't find the remote dir: ${remoteDataPath}`);
      });
    DEBUG && this.#debugLogging(`TRIGGERED.\ninit_path: ${remoteDataPath}\n#####sftp: ${cleanStringify(sftp.client.config, null, 10)}`, '[CONSTRUCTOR]');
    this.sftp = sftp;
    this.remoteDataPath = remoteDataPath;
  }

  async sessionExists(options) {
    DEBUG && await this.#debugLogging(`TRIGGERED.\n##options: ${cleanStringify(options, null, 10)}`, '[METHOD: sessionExists]');
    var remoteFilePath = await path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    const exists = await this.sftp.exists(remoteFilePath);
    DEBUG && await this.#debugLogging(`${exists ? 'FILE_FOUND' : 'FILE_NOT_FOUND'} PATH='${remoteFilePath}'.`, '[METHOD: sessionExists]');
    return exists;
  }

  async save(options) {
    DEBUG && await this.#debugLogging(`TRIGGERED.\n##options: ${cleanStringify(options, null, 10)}`, '[METHOD: save]');
    var remoteFilePath = await path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');

    options.remoteFilePath = remoteFilePath;
    await this.#deletePrevious(options);

    await new Promise((resolve, reject) => {
      fs.createReadStream(`${options.session}.zip`)
        .pipe(this.sftp.createWriteStream(remoteFilePath))
        .on('error', err => reject(err))
        .on('close', () => resolve());
    });
    DEBUG && await this.#debugLogging(`AUTH_FILE_SAVED PATH='${remoteFilePath}'.`, '[METHOD: save]');
  }

  async extract(options) {
    DEBUG && await this.#debugLogging(`TRIGGERED.\n##options: ${cleanStringify(options, null, 10)}`, '[METHOD: extract]');
    var remoteFilePath = await path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    var zipPipe = new Promise((resolve, reject) => {
      this.sftp.createReadStream(remoteFilePath)
        .pipe(fs.createWriteStream(options.path))
        .on('error', err => reject(err))
        .on('close', () => resolve());
    });
    DEBUG && await this.#debugLogging(`PIPE_CREATE FROM=[REMOTE]'${remoteFilePath}' TO=[LOCAL]'${options.path}'.\n##options: ${cleanStringify(options, null, 10)}`, '[METHOD: extract]');
    return zipPipe;
  }

  async delete(options) {
    DEBUG && await this.#debugLogging(`TRIGGERED.\n##options: ${cleanStringify(options, null, 10)}`, '[METHOD: delete]');
    var remoteFilePath = await path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    if (await this.sftp.exists(remoteFilePath)) {
      DEBUG && await this.#debugLogging(`FILE_FOUND PATH='${remoteFilePath}'.`, '[METHOD: delete]');
      await this.sftp.delete(remoteFilePath);
      DEBUG && await this.#debugLogging(`FILE_DELETE PATH='${remoteFilePath}'.`, '[METHOD: delete]');
      return;
    }
    DEBUG && await this.#debugLogging(`FILE_NOT_FOUND PATH='${remoteFilePath}'.`, '[METHOD: delete]');
  }

  async #deletePrevious(options) {
    DEBUG && await this.#debugLogging(`TRIGGERED.\n##options: ${cleanStringify(options, null, 10)}`, '[METHOD: #deletePrevious]');
    if (await this.sftp.exists(options.remoteFilePath)) {
      DEBUG && await this.#debugLogging(`FILE_FOUND PATH='${options.remoteFilePath}'.`, '[METHOD: #deletePrevious]');
      await this.sftp.delete(options.remoteFilePath);
      DEBUG && await this.#debugLogging(`FILE_DELETE PATH='${options.remoteFilePath}'.`, '[METHOD: #deletePrevious]');
      return;
    }
    DEBUG && await this.#debugLogging(`FILE_NOT_FOUND PATH='${options.remoteFilePath}'.`, '[METHOD: #deletePrevious]');
  }

  async #debugLogging(msg = '', logAgent = '[DEBBUGER]', op = 'info') {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

    await console[op](`${localISOTime} ${logAgent}: ${msg}`);
  }
}

module.exports = SftpStore;