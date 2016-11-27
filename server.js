#!/usr/bin/env node

var express = require('express');
var pug = require('pug');
var morgan = require('morgan');
var sqlite = require('sqlite3');
var prompt = require('prompt');
var wget = require('wget-improved');
var tar = require('tarball-extract');
var fs = require("fs");


var opts = {};
opts.port = 3000;

var factorio = {};
factorio.vers = "0.14.20";
factorio.dl = "https://www.factorio.com/get-download/" + factorio.vers + "/headless/linux64";
factorio.file = "headless.tar.gz";
var error = {};

var paths = {};
paths.factorioDir = "/home/bertie/games/factorioServers/";
paths.workingDir = process.cwd();
paths.conf = "/factorio/data/server-settings.example.json";

var fs = require("fs");
var file = paths.workingDir + "/database.db";
var dbExists = fs.existsSync(file);
var pause = false;

var app = express();
var admin = express.Router();
var db = new sqlite.Database(file);


function run() {
    app.listen(opts.port, function() {
        console.log('Factorio Multi Panel listening on port ' + opts.port + '!');
    });
}

function createUser(db, details) {
    var i;
    var q = db.prepare("INSERT INTO User (userID, userName, userPassword, userEmail) VALUES (?,?,?,?)");
    db.get("SELECT * FROM User WHERE userID = (SELECT MAX(userID) FROM User);", function(err, rows) {
        if (rows === undefined) {
            i = 0;
            q.run([i, details.username, details.password, details.email]);
            q.finalize();
        } else {
            i = rows.userID + 1;
            q.run([i, details.username, details.password, details.email]);
            q.finalize();
        }
    });

}



if (!dbExists) {
    pause = true;
    //var db = new sqlite.Database(file);
    console.log("creating Database");
    db.serialize(function() {
        db.run("CREATE TABLE Servers (serverID int, serverDir TEXT);");
        db.run("CREATE TABLE User (userID INT PRIMARY KEY, userName TEXT, userPassword TEXT, userEmail TEXT);");
        db.run("CREATE TABLE ServersUser (link int, userID int, serverID INT);");
        prompt.start();
        prompt.get([{
            name: 'username',
            required: true
        }, {
            name: 'password',
            hidden: true,
            conform: function(value) {
                return true;
            }
        }, {
            name: 'email'
        }], function(err, result) {
            //
            console.log('  username: ' + result.username);
            console.log('  email: ' + result.email);
            console.log('  password: ' + result.password);
            createUser(db, result);
            run();
        });
    });

} else {
    var db = new sqlite.Database(file);
    run();
}

app.use(morgan('common'));
app.use('/static', express.static(__dirname + '/static'));
app.use('/', admin);


admin.get('/', function(req, res) {
   listServers().then((servers) => {
     console.log("/ servers length"+ servers.length);
      const adminTemplate = pug.compileFile(__dirname + '/template.pug');
      const context = { servers: servers };
      const html = adminTemplate(context);
      res.send(html);
   });
});

function listServers() {
  return new Promise((resolve, reject) => {
    const list=[];
    db.each("SELECT * FROM Servers;", function(err, rows){
      const confi = fs.readFileSync(paths.factorioDir + "server" + rows.serverID + paths.conf);
      const conf = JSON.parse(confi);
      const item = {id: rows.serverID, conf:conf};
      list.push(item);
      console.log("in query list length:" + list.length)
    });
    console.log("listServers length:" + list.length)
    resolve(list);
  });
}

admin.get('/addServer', function(req, res) {
    var i = 0;
    db.get("SELECT * FROM Servers WHERE serverID = (SELECT MAX(serverID) FROM Servers);", function(err, rows) {
        if (rows === undefined) {
            i = 0;
        } else {
            i = rows.serverID + 1;
        }
        var dir = paths.factorioDir + "server" + i + "/";
        var q = db.prepare("INSERT INTO Servers (serverID, ServerDir) VALUES (?,?)");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            var out = dir + factorio.file;
            var down = wget.download(factorio.dl, out);
            var ee;
            down.on('error', function(err) {
                console.log(err);
            });
            down.on('end', function(output) {
              console.log(output);
              tar.extractTarball(out, dir, function(err) {
                if (err) console.log(err);
                //if (!err){ 
                    q.run([i, dir]);
                    q.finalize();
                        // }
       
            });
          });
            error.level = "sucess";
            error.details = "Created Server " + (i) + " in " + dir + "!";
            res.send(error.level + ":" + error.details);
        } else {
            console.log("Directory " + dir + " Exists");
            error.level = "warn";
            error.details = "Directory " + dir + " Exists";
            res.send(error.level + ":" + error.details);

        }
    });
});
