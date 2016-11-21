#!/usr/bin/env node

var express = require('express');
var pug = require('pug');

var app = express();

app.get('/', function (req, res) {
	  res.send('Hello World!');
});

app.listen(3000, function () {
	  console.log('Example app listening on port 3000!');
});
