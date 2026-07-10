const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
    },
    content:String,
    date:{
        type:Date,
        default:Date.now,
    },
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
    }]
})

module.exports = mongoose.model("post", userSchema);