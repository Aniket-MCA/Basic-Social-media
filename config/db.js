const mongoose = require("mongoose");

const connectDB = async function () {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DataBase connected Sucessfully");
    }
    catch (err) {
        console.error("MongoDB connection is failed", err.message);
        process.exit(1);
    }
};

module.exports= connectDB;