
var express = require("express");
// models
var comments = require("../models/commentsDB");
var posts = require("../models/postsDB");
var user = require("../models/userDB");
var middleware = require("../middlewares/middlewares"); 
var router = express.Router();



router.get("/posts/show/:id/comments/new",middleware.loggedIn,(req, res)=>{
    posts.findById(req.params.id, (err, foundPost)=>{
        if(err){
            throw err;
            res.redirect("back");
        }else{
            res.render("comments/new", {post : foundPost});
        }
    })   
})

router.post("/posts/show/:id/comments", middleware.loggedIn,(req, res)=>{
    var commenty = {
        text : req.body.text,
        author : {
            id : req.user._id,
            author : req.user.username,
            isAdmin : req.user.isAdmin,
            avatar : req.user.avatar,
        }
    };

    posts.findById(req.params.id, (err, foundPost)=>{
        if(err){
            throw err;
            res.redirect("back");
        }else{
            comments.create(commenty, (err, createdComments)=>{
                if(err){
                    throw err;
                    res.redirect("back");
                }else{
                    createdComments.author.id = req.user.id;
					createdComments.author.username = req.user.username;
					//saving comment
					createdComments.save();
                    foundPost.comments.push(createdComments);
                    foundPost.save();
                    console.log("comment created in the same route");
                    res.redirect("/posts/show/" + req.params.id);
                }
            })
        }
    })   
})

// edit comment

router.get("/posts/show/:id/comments/:comment_id/edit", middleware.loggedIn,middleware.checkCommentOwnership,(req, res)=>{
    comments.findById(req.params.comment_id, (err, foundComment)=>{
        if(err){
            console.log(err);
            console.log(foundComment._id);
        }else{
          
            res.render("comments/edit", {post_id  : req.params.id , comment : foundComment });

        }
    })
})

// updating comment!
router.put("/posts/show/:id/comments/:comment_id/update", middleware.loggedIn,(req, res)=>{
    var commentsBody = {
        text : req.body.text
    };
    comments.findByIdAndUpdate(req.params.comment_id, commentsBody, (err, foundComment)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect("/posts/show/" + req.params.id);
        }
    })
})

// destroping comment
router.delete("/posts/show/:id/comments/:comment_id/delete", middleware.loggedIn,(req, res)=>{
    comments.findByIdAndDelete(req.params.comment_id, (err)=>{
        if(err){
            console.log(err);
            res.redirect("back");
        }else{
            res.redirect("/posts/show/" + req.params.id);
            console.log("comment successfully deleted !");
        }
    })
})
module.exports = router;