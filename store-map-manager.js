const StoreMap = require('./store-map');
const config = require('./config');

class StoreMapManager {
    constructor() {
        this.storeMaps = [];
        this.maxChunkSize = config.maxChunkSize;
    }

    async addRecord(key, value) {
        const record = value;
        return await this._recentStoreMap.setValue(key, record);
    }

    async retrieveRecord(key) {
        if (this.storeMaps.length === 0) {
            throw 'No records exists';
        }

        return await this._getValue(this.storeMaps.length - 1, key);
    }

    get _recentStoreMap () {
        if (this.storeMaps.length === 0) {
            this._addStoreMap();
        }
        return this.storeMaps[this.storeMaps.length - 1];
    }

    async _getValue(index, key) {
        if (index < 0) {
            throw 'Record not found';
        }
        const storeMap = this.storeMaps[index];

        if (!storeMap) {
            throw `No store map exists by index ${index}`;
        }

        if (storeMap.hasValue(key)) {
            return await storeMap.getValue(key);
        } else {
            return await this._getValue(index - 1, key);
        }
    }

    _addStoreMap() {
        this.storeMaps.push(new StoreMap());
    }
}

module.exports = StoreMapManager;