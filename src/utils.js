function required(value, errorMessage) {
    if (value == null) exception(errorMessage);
}

function exception(errorMessage) {
    throw Error(errorMessage);
}

function getKeyFromPart(part) {
    let result = '';

    for(let i = 0; i < part.length; i++) {
        if (part[i] === ':') {
            break;
        }
        result += part[i];
    }
    return result;
}

class NotEnoughSpaceException extends Error {}
class NotFoundException extends Error {}

module.exports = {
    required,
    exception,
    getKeyFromPart,
    NotEnoughSpaceException,
    NotFoundException,
};