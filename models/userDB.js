
var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");



var userSchema = new mongoose.Schema({
    username : String,
    firstName : String,
    lastName : String,
    email : {
        type : String,
        unique : true
    },
    avatar : String,
    coverPhoto : String,
    password : String,
    resetPasswordToken :String,
    resetPasswordDuration : Date,
    isAdmin  : {
        type : Boolean,
        default : false
    },
    posts : {
        id :{
            type : mongoose.Schema.Types.ObjectId,
            ref : "Post"
        },
        image : String,
        title : String,
        content : String
    },
    comments : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref  : "User"
        }
    ],
    isPaid : {
        type : Boolean,
        default : false
    },
 
    followers : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }
    ],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
