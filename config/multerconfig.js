const multer =require("multer");
const crypto = require("crypto");
const path = require("path");

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./public/images/upload");
    },
    filename: function(req, file, cb){
        crypto.randomBytes(5, function(err, name){
           const uniqueName = name.toString("hex") + path.extname(file.originalname);
            cb(null, uniqueName);
        })
    }
})

const upload = multer({storage: storage});
module.exports= upload;