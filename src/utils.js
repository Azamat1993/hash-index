function required(value, errorMessage) {
    if (value == null) exception(errorMessage);
}

function exception(errorMessage) {
    throw Error(errorMessage);
}

module.exports = {
    required,
    exception,
};