
var express = require("express");
var _ = require("lodash");
var async = require("async");
var nodeMailer = require("nodemailer");
var crypto = require("crypto");
var passport = require("passport");


var user = require("../models/userDB");
var posts = require("../models/postsDB");
var comments = require("../models/commentsDB");
var notifications = require("../models/notifications");

var middleware = require("../middlewares/middlewares");
const stripe = require('stripe')('sk_test_6sYYoPMWJHE1E7x5KQsxVLvW00yubngr0f');
var cloudinary = require("cloudinary");
var multer = require("multer");


var router = express.Router();

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





router.get("/register", (req, res)=>{
    res.render("users/register");
});

router.post("/register",upload.single('avatar'), (req, res)=>{
    cloudinary.uploader.upload(req.file.path, function(result){
    var newUser = new user({
         username : req.body.username,
         firstName : req.body.firstName,
         lastName : req.body.lastName,
         email : req.body.email,
         avatar : req.body.avatar = result.secure_url,
         coverPhoto : req.body.cover ,
   
    });

    if(req.body.admin === 'zee10@noori10'){
        newUser.isAdmin = true;
    };
    user.register(newUser, req.body.password,(err, reguser)=>{
        if(err){
            req.flash("error", err.message);
            res.redirect("/register");
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                req.flash("success", "welcome to Fakey webDev!! " + reguser.username);
                res.redirect("/posts");
                console.log("registered successfully!");
            })
        }
    })
})
});




router.get("/login", (req, res)=>{
    res.render("users/login");
});


router.post("/login",passport.authenticate("local", {
    successRedirect : "/posts",
    failureRedirect : "/login"
}) ,(req, res)=>{
});

router.get("/logout", (req, res)=>{
    req.logout();
    req.flash("success", "Bye, see you next time");
    res.redirect("/login");
})


// forgot password reset
router.get("/forgotPass", (req, res)=>{
    res.render("users/forgotPassword");
})

router.post("/forgotPass", (req, res, next)=>{
    async.waterfall([
        function(done){
            crypto.randomBytes(20, (err, buf)=>{
                var token = buf.toString('hex');
                done(err, token);
            })
        },
        function(token, done){
            user.findOne({email : req.body.email}, (err, user)=>{
                if(!user){
                    req.flash("error", "No account with this email address exists!");
                   return   res.redirect("back");
                }
                user.resetPasswordToken = token;
                user.resetPasswordDuration = Date.now() + 3600000; //1 hour

                user.save((err)=>{
                    done(err, token, user);
                });
            })
        },
        function(token, user, done){
            var smtpTransport = nodeMailer.createTransport({
                service : 'Gmail',
                auth:{
                    user:'abedkhan.noori10@gmail.com',
                    pass : process.env.GMAIL_PW
                }
            });
            var mailOptions = {
                to : user.email,
                from : 'abedkhan.noori10@gmail.com',
                subject : 'passwor Reset!',
                text : "you are receiving this email because you want to reset you password in mY App ." + 
                "please click the link below to complete the process. " +
                "http://" + req.headers.host + "/resetPass/" + token + "\n\n" +
                "if you did not request this, please ignore this email and your password will be untouched." 
            };
            smtpTransport.sendMail(mailOptions, (err)=>{
                console.log('mail sent!');
                req.flash("success", "an email has sent to " + user.email + " with further instructions");
                done(err, 'done');
            });
        }
    ], function(err){
        if(err){
            return next(err);
        } res.redirect("/forgotPass");
    });
});

// reset password form
router.get("/resetPass/:token", (req, res)=>{
    user.findOne({resetPasswordToken : req.params.token, resetPasswordDuration : {$gt : Date.now()}}, (err, user)=>{
        if(!user){
            req.flash("error", "Password or rest Token is Invalid or has expired!");
            res.redirect("/forgotPass");
        }else{
            res.render("users/resetPass", {token : req.params.token});
        }
    })
   
});

router.post("/resetPass/:token", (req, res)=>{
    async.waterfall([
        function(done){
            user.findOne(
                {
                    resetPasswordToken : req.params.token, 
                    resetPasswordDuration : {$gt : Date.now()}}
                    ,(err, user)=>{
                if(!user){
                    req.flash("error", "Password or rest Token is Invalid or has expired!");
                    res.redirect("back");
                }
                if(req.body.password === req.body.confirm){
                    user.setPassword(req.body.password, (err)=>{
                        user.resetPasswordDuration = undefined;
                        user.resetPasswordToken = undefined;

                        user.save(function(err){
                            req.login(user, function(err){
                                done(err, user);
                            })
                        })
                    })
                }else{
                    req.flash("error", "Ooops! passwords do not match!");
                    res.redirect("back");
                }
            });
        },
        // again sending email for having updated their password successfully !
        function(user, done){
            // clearifying the sending service (gmail as for us) with user inforamtions 
            var smtpTransport=  nodeMailer.createTransport({
                service : 'Gmail',
                auth : {
                    user : "abedkhan.noori10@gmail.com",
                    pass : process.env.GMAIL_PW
                }
            });
            // creating mail sender and reciver options
            var mailOptions = {
                to : user.email,
                from : "abedkhan.noori10@gmail.com",
                subject : "Success password Reset!",
                text : "Hello ,\n\n" + "This is to confirm that your password has successfully updated!!", 
            }
            
            //  making the nodemiler to send our optins above 
            smtpTransport.sendMail(mailOptions, function(err){
                console.log("email sent again!");
                req.flash("success", "Success! Your password Has been changed!");
                done(err);
            });
        }
    ], function(err){ // prmissing async function is a must(meaning to have a error parameter)
            //  if not error, automatically logged in and should go to posts routes inside
            if(err){
                console.log(err);
            }else{
                res.redirect("/posts");
            }
             
    })
})


// USER profile

router.get("/user/:user_id",middleware.loggedIn, (req, res)=>{
    user.findById(req.params.user_id).populate("followers").exec((err, foundUser)=>{
        if(err){
            req.flash("error", "something went wrong");
            res.redirect("back");
        }
        posts.find().sort({createdAt : "desc"}).populate("comments").where('author.id').equals(foundUser._id).exec(function(err, foundPosts){
            if(err){
                req.flash("error", "something went wrong");
                res.redirect("back");
            }else{
                res.render("users/userProfile", {user : foundUser, posts : foundPosts});
               
            }
        })
    })
})



router.get("/posts/show/:id/user/:user_id/newComment/new", (req, res)=>{
     posts.findById(req.params.id, (err, foundPost)=>{
        if(err){
            console.log(err);
        }else{
           
            res.render("users/newComment", {user_id: req.params.user_id, post:foundPost })
        }
    })
})

// psting the comment in the same route!

router.post("/posts/show/:id/user/:user_id/newComment", (req, res)=>{
    var data = 
    {
        text : req.body.text,
        author : {
            id : req.user._id,
            username : req.user.username
        }
    }
    posts.findById(req.params.id, (err, foundPost)=>{
        if(err){
            console.log(err);
        }else{
            comments.create(data, (err, createdComment)=>{
                if(err){
                    console.log(err);
                }else{
                     console.log("comment creatd " + createdComment);
                     createdComment.author.id = req.user._id;
                     createdComment.author.username = req.user.username;
                     createdComment.author.avatar = req.user.avatar;
                     createdComment.save();
                     foundPost.comments.push(createdComment);
                     foundPost.save();
                     res.redirect("/user/" + req.params.user_id);
                    
                }
            })
        }
    })
})

// EDIT post in user_page 

router.get("/posts/:id/user/:user_id/edit",(req, res)=>{
    posts.findById(req.params.id, (err, foundPost)=>{
        if(err){
            console.log(err);
        }else{          
            res.render("users/editPost", {post  : foundPost , user_id : req.params.user_id });

        }
    })
})

// updating comment!
router.put("/posts/:id/user/:user_id/update",(req, res)=>{
    var data = {
        title : req.body.title,
        content : req.body.content,
        price  : req.body.price,
        image : req.body.image        
    }

    posts.findByIdAndUpdate(req.params.id, data, (err, updatedPost)=>{
        if(err){
            throw err;
            res.redirect("back");
        }else{
            console.log("post updated, " + updatedPost);
            res.redirect("/user/" + req.params.user_id);
        }
    })
});

// edit and delete comments!


router.get("/posts/:id/comments/:comment_id/user/:user_id/editComment", (req, res)=>{
    comments.findById(req.params.comment_id, (err, foundComment)=>{
        if(err){
            console.log(err);
        }else{
            res.render("users/editComment", {post_id : req.params.id, comment  : foundComment, user_id : req.params.user_id})
        }
    })
})


// updaing comment in user profile 

router.put("/posts/:id/comments/:comment_id/user/:user_id/update",(req, res)=>{
    comments.findByIdAndUpdate(req.params.comment_id, {text : req.body.text} , (e, updatedComment)=>{
        if(e){
            throw e;
        }else{
            console.log("comment updated here,"  + req.body.text);
            res.redirect("/user/" + req.params.user_id);
        }
    })

})

// delete comment and return back to user profile

router.delete("/posts/:id/comments/:comment_id/user/:user_id/delete", (req, res)=>{
    comments.findByIdAndDelete(req.params.comment_id, (err)=>{
        if(err){
            res.redirect("back");
            throw err;
        }else{
            res.redirect("/user/" + req.params.id);
        }
    })
})


// edittings user profile

router.get("/editName/:user_id/edit",middleware.checkUserOwnership, (req, res)=>{
    user.findById(req.params.user_id, (err, foundUser)=>{
        if(!err){
            res.render("users/editProfile/editCoverphoto", {user : foundUser});
        }
    })
})


router.put("/editName/:user_id/edit", (req, res)=>{
    user.findByIdAndUpdate(req.params.user_id,{coverPhoto : req.body.cover}, (err, foundUser)=>{
        if(!err){
           req.flash( "success", "your Cover photo has changed Successfully !");
           res.redirect("/user/" + req.params.user_id);
        }else{
            console.log(err);
        }
    })
   
})

// edit profile picture

router.get("/editprofilePic/:user_id/edit", middleware.checkUserOwnership,(req, res)=>{
    user.findById(req.params.user_id, (err, foundUser)=>{
        if(!err){
            res.render("users/editProfile/editAvatar", {user : foundUser});
        }else{
            console.log(err);
        }
    })
})


router.put("/editprofilePic/:user_id/edit", (req, res)=>{
    user.findByIdAndUpdate(req.params.user_id,{avatar : req.body.avatar}, (err, foundUser)=>{
        if(!err){
           req.flash( "success", "your profile picture has changed Successfully !");
           res.redirect("/user/" + req.params.user_id);
        }
    })
   
})

router.get("/editProfile/:user_id/edit", middleware.checkUserOwnership,(req, res)=>{
      user.findById(req.params.user_id, (err, foundUser)=>{
          if(!err){
            res.render("users/editProfile/editProfile", {user : foundUser});
          }
         
      })
})

router.patch("/editProfile/:user_id/edit", (req, res)=>{
      var allBody = req.body;
    user.findByIdAndUpdate(req.params.user_id, allBody,(err, foundUser)=>{
        if(!err){
            req.flash("success", "successfully updated your profile !");
          res.redirect("/user/" + req.params.user_id);
        }else{
            console.log("something went wrong!")
        }
       
    })
})

// // follow user
router.get("/follow/:user_id", (req, res)=>{
    user.findById(req.params.user_id, (err, foundUser)=>{
        if(err){
            console.log(err);
            res.redirect("back");
        }else{
            foundUser.followers.push(req.user._id);
            foundUser.save();
            console.log("successfully follwed ! my follower is " + foundUser);
            res.redirect('/user/' + req.params.user_id);
        }
    })
})





module.exports = router;