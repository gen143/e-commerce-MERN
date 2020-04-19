const User = require('../models/user');
const jwt = require('jsonwebtoken'); // to generate signed token
const expressJwt = require('express-jwt');  // for authorization
const {errorHandler} = require('../helpers/dbErrorHandler');

exports.signup = (req, res) => {
  //console.log(req.body);
    const user = new User(req.body);
    user.save((err, user)=>{
      if(err) {
        return res.status(400).json({
          err: errorHandler(err)
        });
      }
      user.salt = undefined;
      user.hashed_password = undefined;
      res.json({
        user
      })
    })
};


exports.signin = (req, res) => {
  // find the user based onemail

  const {email, password} = req.body;
  User.findOne({email}, (err, user)=>{
    if(err || !user) {
      return res.status(400).json({
        error: 'User with that email doesnot exists....'
      });
    }
    // if user is found, authenticate
    //  Create auth. method in user method
    if(!user.authenticate(password)) {
      return res.status(401).json({
        error: 'Email & Password does not match'
      });
    }
    //genrate a signed token
    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);
    // token as 't'
    res.cookie('t', token, {expire: new Date() + 9999});
    //return response
    const {_id, name, email, role} = user;
    return res.json({token, user: {_id, email, name, role}});
  });
};


exports.signout = (req, res) => {
  res.clearCookie('t');
  res.json({message: 'Signout Success'});
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: "auth"
});


exports.isAuth = (req, res, next) => {
  let user = req.profile && req.auth && req.profile._id == req.auth._id;
  if(!user) {
    return res.status(403).json({
      error: "Access denied"
    });
  }
  next();
};


exports.isAdmin = (req, res, next) => {
  if(res.profile.role === 0) {
    return res.status(403).json({
      error: 'Admin resource! Access Denied'
    });
  }
  next(); 
};
