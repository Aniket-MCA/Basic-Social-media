const express = require("express");
const app = express();
const path = require("path");
const userModel = require("./models/user");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const userPost = require("./models/post");
const multerconfig = require("./config/multerconfig");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

connectDB();

app.use(cookieParser());

app.get("/", function(req, res){
    res.render("register", {
        error: "",
        success: ""
    });
});
app.post("/register", async function(req, res){

    try{

        let { name, username, age, email, password } = req.body;

        if(!name || !username || !age || !email || !password){
            return res.status(400).render("register",{
                error:"All fields are required.",
                success:""
            });
        }

        let user = await userModel.findOne({email:email});

        if(user){
            return res.status(409).render("register",{
                error:"Email is already registered.",
                success:""
            });
        }

        bcrypt.genSalt(10,function(err,salt){

            if(err){
                return res.status(500).render("register",{
                    error:"Unable to generate password salt.",
                    success:""
                });
            }

            bcrypt.hash(password,salt,async function(err,hash){

                if(err){
                    return res.status(500).render("register",{
                        error:"Unable to hash password.",
                        success:""
                    });
                }

                await userModel.create({
                    name:name,
                    username:username,
                    age:age,
                    email:email,
                    password:hash
                });

                res.render("register",{
                    error:"",
                    success:"Registration successful! Please login."
                });

            });

        });

    }
    catch(err){

        console.log(err);

        res.status(500).render("register",{
            error:"Something went wrong.",
            success:""
        });

    }

});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", async function (req, res) {
    try {
        let user = await userModel.findOne({ email: req.body.email });

        // user might not exist - handle before calling bcrypt.compare
        if (!user) {
            return res.status(401).send("Email or password is incorrect");
        }

        bcrypt.compare(req.body.password, user.password, function (err, result) {
            if (err) {
                console.error(err);
                return res.status(500).send("Something went wrong, please try again.");
            }

            if (result === true) {
                let token = jwt.sign({ email: user.email, userid: user._id }, "shhhh");
                res.cookie("token", token);
                res.redirect("/profile");
            } else {
                res.status(401).send("Email or password is incorrect");
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong, please try again.");
    }
});

app.get("/logout", function (req, res) {
    res.cookie("token", "");
    res.redirect("/login");
});

function isLoggedIn(req, res, next) { // this is middleware
    if (!req.cookies.token) {
        return res.redirect("/login");
    }

    try {
        let userdata = jwt.verify(req.cookies.token, "shhhh");
        req.user = userdata;
        next();
    } catch (err) {
        // invalid or expired token
        res.cookie("token", "");
        return res.redirect("/login");
    }
}

app.get("/mypost", isLoggedIn, async function (req, res) { // protected route
    try {
        let founduser = await userModel.findOne({ email: req.user.email }).populate("post");
        if (!founduser) {
            return res.status(404).send("User not found");
        }
        res.render("mypost", { founduser });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong loading your posts.");
    }
});

app.get("/profile", isLoggedIn, async function (req, res) { // protected route
    try {
        let founduser = await userModel.findOne({ email: req.user.email }).populate("post");
        if (!founduser) {
            return res.status(404).send("User not found");
        }
        let post = await userPost.find().populate("user");
        res.render("profile", { founduser, post });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong loading your profile.");
    }
});

app.post("/post", isLoggedIn, async function (req, res) {
    try {
        let user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).send("User not found");
        }
        let post = await userPost.create({
            user: user._id,
            content: req.body.postdata,
        });
        user.post.push(post._id);
        await user.save();
        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while creating your post.");
    }
});

app.get("/like/:postid", isLoggedIn, async function (req, res) {
    try {
        let post = await userPost.findOne({ _id: req.params.postid }).populate("user");
        if (!post) {
            return res.status(404).send("Post not found");
        }

        if (post.likes.indexOf(req.user.userid) === -1) {
            post.likes.push(req.user.userid);
        } else {
            let index = post.likes.indexOf(req.user.userid);
            post.likes.splice(index, 1);
        }
        await post.save();
        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while updating the like.");
    }
});

app.get("/edit/:postid", isLoggedIn, async function (req, res) {
    try {
        let post = await userPost.findOne({ _id: req.params.postid }).populate("user");
        if (!post) {
            return res.status(404).send("Post not found");
        }
        res.render("edit", { post });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong loading the post.");
    }
});

app.post("/update/:postid", isLoggedIn, async function (req, res) {
    try {
        let updated = await userPost.findOneAndUpdate(
            { _id: req.params.postid },
            { content: req.body.postdata }
        );
        if (!updated) {
            return res.status(404).send("Post not found");
        }
        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while updating the post.");
    }
});

app.get("/profile/upload", isLoggedIn, function (req, res) {
    res.render("uploadProfile");
});

// isLoggedIn now runs BEFORE multer, so unauthenticated users can't trigger an upload
app.post("/profile/upload", isLoggedIn, multerconfig.single("image"), async function (req, res) {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }
        await userModel.findOneAndUpdate(
            { email: req.user.email },
            { profilePic: req.file.filename }
        );
        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while uploading your profile picture.");
    }
});

// catch-all error handler (for anything that still slips through)
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("Something went wrong on our end.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server running on the PORT ${PORT}`);
});