const geoip = require("geoip-lite");


const getCountryFromIp = (ipAddress) => {

    if (!ipAddress) {
        return null;
    }


    let ip = ipAddress;


    /*
     * Convert IPv4-mapped IPv6 addresses.
     *
     * ::ffff:192.168.1.10
     *        ↓
     * 192.168.1.10
     */
    if (
        ip.startsWith("::ffff:")
    ) {
        ip =
            ip.substring(7);
    }


    /*
     * Local/private IPs do not have
     * a geographical location.
     */
    if (
        ip === "::1" ||
        ip === "127.0.0.1" ||
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        ip.startsWith("172.")
    ) {
        return null;
    }


    const location =
        geoip.lookup(ip);


    if (!location) {
        return null;
    }


    return location.country || null;
};


module.exports = {
    getCountryFromIp
};