const ApiError = require("../utils/ApiError");


const errorHandler = (
    err,
    req,
    res,
    next
)=>{


    let error = err;


    if(!(error instanceof ApiError)){

        error = new ApiError(
            500,
            "Internal Server Error"
        );

    }


    return res.status(error.statusCode)
    .json({

        success:false,

        message:error.message

    });

};


module.exports = errorHandler;