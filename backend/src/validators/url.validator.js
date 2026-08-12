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

module.exports = {
    validateUrl
};