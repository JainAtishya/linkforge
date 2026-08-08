const ms = require("ms");

const getDurationInMs = (duration) => {
    const milliseconds = ms(duration);

    if (typeof milliseconds !== "number") {
        throw new Error(
            `Invalid duration: ${duration}`
        );
    }

    return milliseconds;
};

module.exports = {
    getDurationInMs
};