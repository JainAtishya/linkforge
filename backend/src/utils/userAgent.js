const getDevice = (userAgent = "") => {

    const ua =
        userAgent.toLowerCase();


    if (
        ua.includes("tablet") ||
        ua.includes("ipad")
    ) {
        return "tablet";
    }


    if (
        ua.includes("mobile") ||
        ua.includes("android") ||
        ua.includes("iphone")
    ) {
        return "mobile";
    }


    if (ua) {
        return "desktop";
    }


    return "unknown";
};


const getBrowser = (userAgent = "") => {

    const ua =
        userAgent.toLowerCase();


    if (ua.includes("edg/")) {
        return "Edge";
    }


    if (ua.includes("chrome/")) {
        return "Chrome";
    }


    if (ua.includes("firefox/")) {
        return "Firefox";
    }


    if (
        ua.includes("safari/") &&
        !ua.includes("chrome/")
    ) {
        return "Safari";
    }


    return "unknown";
};


module.exports = {
    getDevice,
    getBrowser
};