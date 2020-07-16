
var user = require("../models/userDB");
var posts = require("../models/postsDB");
var comments= require("../models/commentsDB");

var middleware = {};
// loggin config or authentication config
middleware.loggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
    // req.flash("error", "you need to be registered first!");
}

// check ownership or authorizatin config
middleware.checkOwnership = function(req, res, next){
    if(req.isAuthenticated()){
     posts.findById(req.params.id, (err, foundpost)=>{
            if(!err){
                if(foundpost.author.id || foundpost.isAdmin.equals(req.user._id) ){
                    next();
                }else{
                    res.redirect("back");
                }
            }else{
                console.log(err);
            }
        })
    }
 }


//  comments middleware
middleware.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        comments.findById(req.params.comment_id, (err, foundComment)=>{
            if(!err){
                if(foundComment.author.id || foundComment.author.isAdmin.equals(req.user._id)){
                    next();
                }else{
                    res.redirect("back");
                }
            }
        })
    }
}

// check user ownership

middleware.checkUserOwnership = function(req, res, next){
    if(req.isAuthenticated()){
       user.findById(req.params.user_id, (err, foundUser)=>{
            if(!err){
                if( foundUser._id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    res.redirect("back");
                }
            }
        })
    }
}



module.exports = middleware;
