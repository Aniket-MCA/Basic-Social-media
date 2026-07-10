const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = mongoose.Schema({
    name:String,
    username:String,
    age:Number,
    email:String,
    password:String,
    profilePic:{
        type:String,
        default:"profile_placeholder.jpg"
    },
    post:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"post",
    }]
})

module.exports = mongoose.model("user", userSchema);