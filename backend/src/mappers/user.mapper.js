const toUserResponse = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
};

module.exports = {
    toUserResponse
};