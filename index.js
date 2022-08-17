const http = require('http');
const fs = require('fs');
const url = require('url');
const map = new Map();
const dbFileName = 'db';

http.createServer(function(req, res) {
    const queryObject = url.parse(req.url, true).query;

    switch (queryObject.command) {
        case 'set':
            var { key, value } = queryObject;
            if (key == null || value == null) {
                return res.end('Invalid parameters');
            }
            fs.stat(dbFileName, (err, stats) => {
                if (err) {
                    return res.end(`Open stats error ${err}`);
                }
                const strToWrite = `${value}\\n`;
                map.set(key, {
                    start: stats.size,
                    size: strToWrite.length,
                });
                fs.appendFile(dbFileName, strToWrite, function(err) {
                    if (err) {
                        res.end(`Append to file error ${err}`);
                    } else {
                        res.end('Success');
                    }
                });
            });
            
            break;
        case 'get':
            var { key } = queryObject;
            if (key == null) {
                return res.end('Invalid parameters');
            }

            if (!map.has(key)) {
                return res.end(`No entity with key: ${key}`);
            }

            const { size, start } = map.get(key);
            const buffer = new Buffer.alloc(size);

            fs.open('db', 'r+', (err, fd) => {
                if (err) {
                    return res.end(`Failed to open file: ${dbFileName}`)
                }
                fs.read(fd, buffer, 0, buffer.length, start, (err, bytes) => {
                    if (err) {
                        return res.end(`Failed to read file: ${dbFileName}`)
                    }
                    console.log('the start is', start, bytes);
                    res.end(buffer.toString());
                });
            });
            break;
        default:
            return res.end('Invalid parameters');
    }
}).listen(9000);