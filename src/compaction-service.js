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
    }
}

module.exports = CompactionService;