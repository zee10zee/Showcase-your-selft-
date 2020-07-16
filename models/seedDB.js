
var mongoose = require("mongoose");

var posts = require("../models/postsDB");
var comments = require("../models/commentsDB");


var newPosts = [
    {
        title : "the earth-beneath",
        image : "https://images.unsplash.com/photo-1580057751284-a6cef988ee53?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjExMDk0fQ&auto=format&fit=crop&w=400&q=60",
        content : "what do you thing is under the earth ??!"
    },
    {
        title : "the earth-above",
        image : "https://images.unsplash.com/photo-1580057751284-a6cef988ee53?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjExMDk0fQ&auto=format&fit=crop&w=400&q=60",
        content : "what do you thing is under the earth ??!"
    },
    {
        title : "taste of lonliness",
        image : "https://images.unsplash.com/photo-1580057751284-a6cef988ee53?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjExMDk0fQ&auto=format&fit=crop&w=400&q=60",
        content : "what do you thing is under the earth ??!"
    },
]

module.exports = function seedDB(){
    posts.remove((err)=>{
        if(err){
            throw err;
        }
        console.log("posts removed !");
        
        newPosts.forEach((post)=>{
            posts.create(post, (err, createdPosts)=>{
                if(err){
                    throw err;
                }else{
                    comments.create({
                        text : "this is the collest pic!",
                        author : "nasim"
                    }, (err, createdComment)=>{
                        if(err){
                            console.log(err);
                        }else{
                            createdPosts.comments.push(createdComment);
                            createdPosts.save();
                            console.log("comment created !");
                        }
                    })
                }
            })
        })
    })
}


