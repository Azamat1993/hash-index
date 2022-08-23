const { v4: uuidv4 } = require('uuid');
const utils = require('./utils');
const StoreMap = require('./store-map');

class StoreMapManager {
    constructor(prefix, maxSpacePerStoreMap) {
        utils.required(prefix, 'Prefix is required');

        this._storeMaps = [];
        this._prefix = prefix;
        this._maxSpacePerStoreMap = maxSpacePerStoreMap || 100;
    }

    get prefix() {
        return this._prefix;
    }

    set prefix(newPrefix) {
        utils.exception('Prefix is read only');
    }

    get maxSpacePerStoreMap() {
        return this._maxSpacePerStoreMap;
    }

    set maxSpacePerStoreMap(space) {
        utils.exception('Max space is read only');
    }

    async store(key, value, level = 0) {
        try {
            await this._recentStoreMap.store(key, value);
        } catch (err) {
            if (err instanceof utils.NotEnoughSpaceException) {
                if (level === 0) {
                    this._addStoreMap();
                    return await this.store(key, value, level + 1);
                } else {
                    throw err;
                }
            } else {
                throw err;
            }
        }
    }

    async retrieve(key, currentStoreMap = this._storeMaps.length - 1) {
        try {
            return await this._storeMaps[currentStoreMap].retrieve(key);
        } catch(err) {
            if (err instanceof utils.NotFoundException) {
                if (currentStoreMap > 0) {
                    return await this.retrieve(key, currentStoreMap - 1);
                } else {
                    return null;
                }
            } else {
                throw err;
            }
        }
    }

    get _recentStoreMap () {
        if (this._storeMaps.length === 0) {
            this._addStoreMap();
        }
        return this._storeMaps[this._storeMaps.length - 1];
    }

    _addStoreMap() {
        this._storeMaps.push(
            new StoreMap(
                this._generateFileName(), 
                this.maxSpacePerStoreMap,
            ),
        );
    }

    _generateFileName() {
        return `${this.prefix}-${uuidv4()}`;
    }
}

module.exports = StoreMapManager;