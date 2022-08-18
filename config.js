const config = require('./config.json');

class Config {
    constructor() {
        this.dbFileName = config.dbFileName;
        this.maxChunkSize = config.maxChunkSize;
    }
}

const instance = new Config();

module.exports = instance;
