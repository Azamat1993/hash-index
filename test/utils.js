const fs = require('fs');

async function filesWithPrefix(dir, prefix) {
    const files = await fs.promises.readdir(dir);
    const result = [];
    for(let file of files) {
        if (file.startsWith(prefix)) {
            result.push(file);
        }
    }
    return result;
}

async function deleteWithPrefix(dir, prefix) {
    const files = await filesWithPrefix(dir, prefix);

    for (let file of files) {
        const path = dir + '/' + file;
        if (fs.existsSync(path))
            fs.unlinkSync(path);
    }
}

module.exports = {
    filesWithPrefix,
    deleteWithPrefix,
}