#!/usr/bin/env node

var express = require('express');
var pug = require('pug');
var morgan = require('morgan');


var app = express();
var admin = express.Router();

app.use(morgan('common'));
app.use('/static', express.static(__dirname+'/static'));
app.use('/', admin);

app.get('/', function (req, res) {
	   adminTemplate = pug.compileFile(__dirname+'/template.pug');
		 html = adminTemplate();
     res.send(html);
});

app.listen(3000, function () {
	  console.log('Example app listening on port 3000!');
});
