const mongoose = require("mongoose");

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