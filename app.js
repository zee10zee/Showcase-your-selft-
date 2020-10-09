require('dotenv').config()

var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var moment = require("moment");
var _ = require("lodash");
var flash = require("connect-flash");
var cloudinary = require("cloudinary");
var multer = require("multer");
var storage = multer.diskStorage({
    filename : function(req, file, callback){
        callback(null, Date.now() + file.originalname);
    }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({  //ganna call this in post route as middleware
    storage : storage,
    fileFilter : imageFilter
});
// the above is all about multer 

// cloudinary config
cloudinary.config({
    cloud_name : 'zeenoori10',
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_SECRET_KEY
});

// of passports
var session = require("express-session");
var passport = require("passport");
var passportLocal = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");

// MODELS
var posts = require("./models/postsDB");
var comments = require("./models/commentsDB");
var user = require("./models/userDB");
var notifications = require("./models/notifications");

// ROUTS
var postsRoutes =  require("./routes/posts");
var commentsRoutes =  require("./routes/comments");
var usersRoute =  require("./routes/users");
const { mongo } = require('mongoose');


var app = express();


// mongoose.connect("mongodb://localhost/chatAppDB", 
// { useUnifiedTopology: true , useNewUrlParser : true});

mongoose.connect(process.env.DATABASE_URL, 
{ useUnifiedTopology: true , useNewUrlParser : true});

const db = mongoose.connection;
db.on('error', (error)=>{
     console.log("the problem is " +  error);
})
db.once("open", ()=>{ console.log("connected !")})

app.locals.moment = require("moment");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(flash());
mongoose.set('useCreateIndex', true);


// setting up sesion-expression config
app.use(session({
    secret : "no secret !",
    resave : false,
    saveUninitialized : false
}));

// initializing passaport
app.use(passport.initialize());
// settin up session
app.use(passport.session());


// passport local cinfig
passport.use(new passportLocal(user.authenticate()));

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

// locals
app.use(function(req, res, next){
   res.locals.currentUser = req.user; 
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// using exported routes
app.use("/posts",postsRoutes);
app.use("", commentsRoutes);
app.use(usersRoute);




// routes starts 
app.get("/", (req, res)=>{
    res.redirect("/posts");
});





app.listen(process.env.PORT || 3000, ()=>{
    console.log("you good to go! 3000")
});