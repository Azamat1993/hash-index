function required(value, errorMessage) {
    if (value == null) exception(errorMessage);
}

function exception(errorMessage) {
    throw Error(errorMessage);
}

class NotEnoughSpaceException extends Error {}

module.exports = {
    required,
    exception,
    NotEnoughSpaceException,
};