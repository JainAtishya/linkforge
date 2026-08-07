const {
    registerUser
} = require("../services/auth.service");


const asyncHandler =
require("../utils/asyncHandler");



const register =
asyncHandler(
async(req,res)=>{


    const {
        name,
        email,
        password
    } = req.body;



    const user =
        await registerUser({
            name,
            email,
            password
        });



    res.status(201)
    .json({

        success:true,

        message:
        "User registered successfully",

        user:{
            id:user._id,
            name:user.name,
            email:user.email
        }

    });


});


module.exports = {
    registerUser:register
};