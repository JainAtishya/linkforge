const { customAlphabet } = require("nanoid");

const BASE62 =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const generateShortCode =
    customAlphabet(BASE62, 8);

module.exports = {
    generateShortCode
};