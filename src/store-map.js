const fs = require('fs');
const utils = require('./utils');

class StoreMap {
    constructor(fileName, maxSpace) {
        utils.required(fileName, 'File name is required');
        this._fileName = fileName;
        this._hashTable = new Map();
        this._maxSpace = maxSpace || 100;
        this._currentSpace = 0;
    }

    get fileName () {
        return this._fileName;
    }

    set fileName (name) {
        utils.exception('File name is read only');
    }

    get hashTable() {
        return this._hashTable;
    }

    set hashTable(table) {
        utils.exception('Hash table is read only');
    }

    get maxSpace() {
        return this._maxSpace;
    }

    set maxSpace(space) {
        utils.exception('Max space is read only');
    }

    async store(key, value) {
        utils.required(key, 'Key is required');
        utils.required(value, 'Value is required');

        try {
            await fs.promises.access(this.fileName);
        } catch (err) {
            if (err.code === 'ENOENT')
                await fs.promises.writeFile(this.fileName, '');
            else utils.exception(err.message);
        }

        const valueToWrite = this._encode(key, value);

        if (!this._enoughSpace(valueToWrite)) {
            throw new utils.NotEnoughSpaceException('Not enough space');
        }

        try {
            const stats = await fs.promises.stat(this.fileName);
            await fs.promises.appendFile(this.fileName, valueToWrite);
            this.hashTable.set(key, {
                offset: stats.size,
                size: valueToWrite.length,
            });
            this._currentSpace += stats.size + valueToWrite.length;
        } catch(err) {
            utils.exception(err.message);
        }
    }

    async retrieve(key) {
        utils.required(key, 'Key is required');

        if (!this.hashTable.has(key)) {
            throw new utils.NotFoundException('Value by key ' + key + ' does not exist.');
        }

        const {
            offset,
            size
        } = this.hashTable.get(key);
        const buffer = new Buffer.alloc(size);

        return new Promise((resolve, reject) => {
            fs.open(this.fileName, 'r+', (err, fd) => {
                if (err != null) return void reject(err.message);
                fs.read(fd, buffer, 0, buffer.length, offset, (err) => {
                    if (err != null) return void reject(err.message);
                    resolve(buffer.toString());
                });
            });
        });
    }

    async readFile() {
        if (this._hashTable.size !== 0) {
            utils.exception('Cannot read file, when hash table have values');
        }

        // checks whether file exists.
        await fs.promises.access(this.fileName);

        try {
            const contents = await fs.promises.readFile(this.fileName, { encoding: 'utf-8'});
            const parts = contents.split('\\n');
            let currentOffset = 0;

            for(let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (part) {
                    const key = this._getKeyFromPart(part);

                    this._hashTable.set(key, currentOffset);

                    currentOffset += part.length;
                    currentOffset += '\\n'.length;
                }
            }
        } catch(err) {
            utils.exception(`Error while trying to read a file ${err}`);
        }
    }

    static async buildFromFile(fileName) {
        const storeMap = new StoreMap(fileName);
        await storeMap.readFile();
        return storeMap;
    }

    _enoughSpace(value) {
        return this._currentSpace + value.length <= this.maxSpace;
    }

    _encode(key, value) {
        return `${key}:${value}\\n`;
    }

    _getKeyFromPart(part) {
        let result = '';

        for(let i = 0; i < part.length; i++) {
            if (part[i] === ':') {
                break;
            }
            result += part[i];
        }
        return result;
    }
}

module.exports = StoreMap;