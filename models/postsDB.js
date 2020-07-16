
var express = require("express");
var mongoose = require("mongoose");
var user = require("./userDB");
var passportLocalMongoose = require("passport-local-mongoose");


var postSchema = new mongoose.Schema({
    title : String,
    image : String,
    content : String,
    price: Number,
    createdAt : {
        type : Date,
        default : Date.now()
    },
    comments : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Comment",
        }
    ],
    author : {
        id : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },
        username : String
    }
  
});

postSchema.plugin(passportLocalMongoose);

module.exports=  mongoose.model("Post", postSchema);