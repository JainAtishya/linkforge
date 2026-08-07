const User = require("../models/user.model");

const {
    hashPassword
} = require("../utils/password");

const ApiError = require("../utils/ApiError");


const registerUser = async({
    name,
    email,
    password
})=>{


    const existingUser =
        await User.findOne({
            email
        });


    if(existingUser){

        throw new ApiError(
            409,
            "User already exists"
        );

    }


    const passwordHash =
        await hashPassword(password);


    const user =
        await User.create({

            name,

            email,

            passwordHash

        });


    return user;

};


module.exports = {
    registerUser
};