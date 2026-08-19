const validateUrl = (value) => {

    try {

        const url = new URL(value);

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return false;
        }

        return true;

    } catch {

        return false;

    }
};


const validateCustomAlias = (value) => {

    if (
        typeof value !== "string" ||
        value.length < 3 ||
        value.length > 30
    ) {
        return false;
    }

    return /^[a-zA-Z0-9_-]+$/.test(value);
};


module.exports = {
    validateUrl,
    validateCustomAlias
};