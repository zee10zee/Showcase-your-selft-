require('dotenv').config()

var express = require("express");
var cloudinary = require("cloudinary");
var multer = require("multer");

// models
var posts = require("../models/postsDB");
var user = require("../models/userDB");
var Notification = require("../models/notifications");
var router = express.Router();
var middleware = require("../middlewares/middlewares");
var users = require("./users");

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
    secret_key : process.env.CLOUDINARY_SECRET_KEY
});



router.get("/",(req, res)=>{
  
     if(req.query.search){
         console.log(req.query);
        //  note  : fuzzy search can be made through regex i thing as one way
         const regex = new RegExp(escapeRegex(req.query.search), 'gi');
         posts.find({title : regex},(err, posts)=>{
            res.render("index", {posts : posts});
        }).sort({createdAt : "desc"})
     }else{
        posts.find((err, posts)=>{
            res.render("index", {posts : posts});
        }).sort({createdAt : "desc"})
     }
   
});

router.get("/new",  middleware.loggedIn,(req, res)=>{
    res.render("new")
});


router.post("/new",upload.single('image'),(req, res)=>{
    cloudinary.uploader.upload(req.file.path, function(result){
        posts.create({
            title : req.body.title,
            image : req.body.image = result.secure_url,
            content : req.body.content,
            price : req.body.price,
            author : {
                id : req.user._id,
                username : req.user.username,
            }
        }, (err, createdpost)=>{
            if(err){
                console.log(err);
                res.redirect("back");
            }else{
                res.redirect("/posts");
            }
        })
    })
})





// show more !

router.get("/show/:id", middleware.loggedIn,(req, res)=>{
    posts.findById(req.params.id).populate("comments").exec((err, foundPost)=>{
        if(err){
            throw err;
            res.send(err);
        }else{
            res.render("show", {post : foundPost});
        }
    })   
});

// edit route
router.get("/:id/edit", middleware.loggedIn,middleware.checkOwnership,(req, res)=>{
    posts.findById(req.params.id, (err, foundpost)=>{
        if(!err){
            res.render("edit", {post: foundpost});
        }else{
            throw err;
        }
    })
});


// update route
router.put("/:id/update", middleware.loggedIn,middleware.checkOwnership,(req, res)=>{
    var posty = {
        title : req.body.title,
        image : req.body.image,
        content : req.body.content,
        price : req.body.price
    };
           posts.findByIdAndUpdate(req.params.id, posty, (err, updatedPost)=>{
               if(err){
                   throw err;
                   res.redirect("back");
               }else{
                   res.redirect("/posts/show/" + req.params.id);
                   console.log("success update !")
               }
           })
});

// DELTE ROUTE
router.delete("/:id/delete", middleware.loggedIn,middleware.checkOwnership,(req, res)=>{
    posts.findByIdAndRemove(req.params.id ,(err)=>{
        if(err){
            throw err;
        }else{
            res.redirect("/posts");
        }
    })
})




// search function
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;