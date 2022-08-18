const fs = require('fs');
const config = require('./config');

class StoreMap {
    constructor() {
        this.map = new Map();
        this.dbFileName = config.dbFileName;
    }
    async setValue(key, value) {
        return new Promise((resolve, reject) => {
            fs.stat(this.dbFileName, (err, stats) => {
                if (err) {
                    return void reject(`Open stats error ${err}`);
                }
                const strToWrite = `${value}\\n`;
                this.map.set(key, {
                    start: stats.size,
                    size: strToWrite.length,
                });
                fs.appendFile(this.dbFileName, strToWrite, function(err) {
                    if (err) {
                        return void reject(`Append to file error ${err}`);
                    } else {
                        return void resolve('Success');
                    }
                });
            });
        });
    }

    hasValue(key) {
        return this.map.has(key);
    }

    async getValue(key) {
        return new Promise((resolve, reject) => {
            if (!this.hasValue(key)) {
                return void reject(`No entity with key: ${key}`);
            }
    
            const { size, start } = this.map.get(key);
            const buffer = new Buffer.alloc(size);
    
            fs.open('db', 'r+', (err, fd) => {
                if (err) {
                    return void reject(`Failed to open file: ${this.dbFileName}`)
                }
                fs.read(fd, buffer, 0, buffer.length, start, (err, bytes) => {
                    if (err) {
                        return void reject(`Failed to read file: ${this.dbFileName}`)
                    }
                    return void resolve(buffer.toString());
                });
            });
        });
    }

    async fileSize() {
        return new Promise((resolve, reject) => {
            fs.stat(this.dbFileName, (err, stats) => {
                if (err) {
                    return void reject(`Open stats error ${err}`);
                }
                return void resolve(stats.size);
            });
        });
    }
}

module.exports = StoreMap;