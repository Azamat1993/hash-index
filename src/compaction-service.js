const fs = require('fs');
const utils = require('./utils');
class CompactionService {
    async compact(fileName, newFileName) {
            utils.required(fileName, 'File name is required');
            utils.required(newFileName, 'New File name is required');

            // checks whether file exists.
            await fs.promises.access(fileName);

            try {
                await fs.promises.access(newFileName);

                utils.exception(`New file ${newFileName} should not exist`);
            } catch (err) {
                if (err.code === 'ENOENT')
                    await fs.promises.writeFile(newFileName, '');
                else utils.exception(err.message);
            }

            const map = new Map();
            const queue = [];

            const contents = await fs.promises.readFile(fileName, { encoding: 'utf-8'});
            const parts = contents.split('\\n');

            let currentOffset = 0;

            for(let i = 0; i < parts.length; i++) {
                const part = parts[i];

                if (part) {
                    const key = utils.getKeyFromPart(part);

                    map.set(key, currentOffset);

                    currentOffset += part.length;
                    currentOffset += '\\n'.length;

                    queue.push(key);
                }
            }

            const visited = new Set();
            const stack = [];

            for (let i = queue.length - 1; i >= 0; i--) {
                const key = queue[i];

                if (!visited.has(key)) {
                    stack.push(key);
                    visited.add(key);
                }
            }

            let newFileContents = '';

            while (stack.length > 0) {
                const key = stack.pop();
                const offset = map.get(key);

                let value = '';

                for (let j = offset; j < contents.length; j++) {
                    if ((j + 1) < contents.length && (contents[j] === '\\' && contents[j + 1] === 'n')) {
                        break;
                    }
                    value += contents[j];
                }

                newFileContents += value;
                
                if (stack.length > 0) {
                    newFileContents += '\\n';
                }
            }

            await fs.promises.writeFile(newFileName, newFileContents);

            // removes pre-compaction file
            await fs.promises.unlink(fileName);
    }

    async compactAndMerge(fileNames, newFileName) {
            if (!Array.isArray(fileNames)) {
                utils.exception('File names should be of type array');
            }

            if (fileNames.length === 0) {
                utils.exception('File names should not be empty');
            }

            utils.required(fileNames, 'File names is required');
            utils.required(newFileName, 'New File name is required');

            try {
                await this._checkFilesExist(fileNames);
            } catch(err) {
                utils.exception('Provided files should exist');
            }

            try {
                await fs.promises.access(newFileName);

                utils.exception(`New file ${newFileName} should not exist`);
            } catch (err) {
                if (err.code === 'ENOENT')
                    await fs.promises.writeFile(newFileName, '');
                else utils.exception(err.message);
            }

            let newFileContents = '';

            await fs.promises.writeFile(newFileName, newFileContents);

            // removes pre-compaction file
            await this._removeFiles(fileNames);
    }

    async _removeFiles(fileNames) {
        return this._handleFiles(fileNames, (fileName) => fs.promises.unlink(fileName));
    }

    async _handleFiles(fileNames, promiseFn) {
        return new Promise((resolve, reject) => {
            let resolvedAmount = 0;
            let shouldHandle = true;

            for(let i = 0; i < fileNames.length; i++) {
                // checks whether file exists.
                promiseFn(fileNames[i]).then(file => {
                    if(shouldHandle) {
                        resolvedAmount++;
                    }

                    if (resolvedAmount === fileNames.length) {
                        resolve(true);
                    }
                }).catch(err => {
                    if (shouldHandle) {
                        reject(err);
                    }
                });   
            }
        });
    }

    async _checkFilesExist(fileNames) {
        return this._handleFiles(fileNames, (fileName) => fs.promises.access(fileName));
    }
}

module.exports = CompactionService;