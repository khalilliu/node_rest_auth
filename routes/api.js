const express = require('express');
const router = express.Router();

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var jwt = require('jsonwebtoken');

var User = require('../models/user');
var Book = require('../models/book');



// helpers
var getToken = function(headers){
	if(headers && headers.authorization){
		var parted = headers.authorization.split(' ');
		if(parted.length === 2){
			return parted[1];
		}else{
			return null;
		}
	} else {
		return null;
	}

};



//routes

router.post('/signup', function(req, res){
	if(!req.body.username || !req.body.password){
		res.json({success: false, msg: 'Please pass username and password'});
	}else{
		var newUser = new User({
			username: req.body.username,
			password: req.body.password
		});

		//save the user
		newUser.save()
			.then(function(){
				res.json({success: true, msg: 'Successfully created a new User'});
			})
			.catch(function(err){
				res.json({success:false, msg: 'username already existed'});
			})
	}
})

router.post('/signin', function(req,res){
	User.findOne({
		username: req.body.username
	})
	.then(user => {
		if(!user){
			res.status(401).send({success: false, msg:'Authentication failed. User not found.'})
		}
		else{
			//check if the password matches
			user.comparePassword(req.body.password, function(err, isMatch){
				if(isMatch && !err){
					var token = jwt.sign(user.toObject(), config.secret);

					res.json({success:true, token: 'JWT' + token});
				}else{
					res.status(401).send({success:false, msg: 'Authentication failed. Wrong password.'})
				}
			})
		}
	})
	.catch(err => res.json(err));
})

router.post('/book', passport.authenticate('jwt',{session:false}), function(req,res){
	var token = getToken(req.headers);
	if(token){
		console.log(req.body);
		var newBook = new Book({
			isbn: req.body.isbn,
			title: req.body.title,
			author: req.body.author,
			publisher: req.body.publisher
		});

		newBook.save()
			.then(newBook => {
				res.json({success:true, msg:'Successfully created new book'})
			})
			.catch(err => {
				res.json({success: false, msg: 'Save book failed.'})
			})
	}else{
		return res.status(403).send({success: false, msg: 'Unauthorized.'});
	}
})

router.get('/book', passport.authenticate('jwt',{session:false}), function(req,res){
	var token = getToken(req.headers);
	if(token){
		Book.find({})
			.then(books => {
				res.json(books);
			})
			.catch(err => res.json(err));
	}else{
		return res.status(403).send({success: false, msg: 'Unauthorized.'});
	}
})

module.exports = router;