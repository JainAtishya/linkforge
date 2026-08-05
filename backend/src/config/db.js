const mongoose = require("mongoose");
const { MONGO_URI } = require("./env");


const connectDB = async () => {
    try {

        await mongoose.connect(MONGO_URI);

        console.log("MongoDB connected");

    } catch(error){

        console.error("MongoDB connection failed");
        console.error(error.message);

        process.exit(1);
    }
};


module.exports = connectDB;