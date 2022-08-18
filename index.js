const http = require('http');
const url = require('url');
const StoreMapManager = require('./store-map-manager');

const storeManager = new StoreMapManager();

http.createServer(async function(req, res) {
    const queryObject = url.parse(req.url, true).query;

    switch (queryObject.command) {
        case 'set':
            var { key, value } = queryObject;
            if (key == null || value == null) {
                return res.end('Invalid parameters');
            }
            try {
                const response = await storeManager.addRecord(key, value);
                res.end(response);
            } catch (e) {
                res.end(e);
            } 
            break;
        case 'get':
            var { key } = queryObject;
            if (key == null) {
                return res.end('Invalid parameters');
            }
            try {
                const response = await storeManager.retrieveRecord(key);
                res.end(response);
            } catch(e) {
                res.end(e);
            }
            break;
        default:
            return res.end('Invalid parameters');
    }
}).listen(9000);