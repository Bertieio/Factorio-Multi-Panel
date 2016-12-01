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



var listServers = function(callback) {
    var list = [];
    db.all("SELECT * FROM Servers;", function(err, rows) {
        if (err) {
            callback(err, []);

            return;
        }

        rows.forEach(function(e) {
            var confi = fs.readFileSync(paths.factorioDir + "server" + e.serverID + paths.conf);
            var conf = JSON.parse(confi);
            var item = {
                id: e.serverID,
                conf: conf
            };
            list.push(item);
        });
        callback(null, list);
    });
};

admin.get('/', function(req, res) {
    listServers(function(err, data) {
        if (err) {
            // Handle error
        }
        servers = data;
        var adminTemplate = pug.compileFile(__dirname + '/template.pug');
        var context = {
            servers: servers
        };
        var html = adminTemplate(context);
        res.send(html);
    });
});

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
                    q.run([i, dir]);
                    q.finalize();
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

admin.get('/server', function(req, res) {
  listServer(req.query.id, function(err, data) {
      if (err) {
          // Handle error
      }
      server = data;
      //console.log(server.conf.tags.length);
      var adminTemplate = pug.compileFile(__dirname + '/serverTemp.pug');
      var context = {
          server: server
      };
      var html = adminTemplate(context);
      res.send(html);
  });
});

var listServer = function(id, callback) {
    var item;
    db.all("SELECT * FROM Servers WHERE serverID = "+ id +";", function(err, rows) {
        if (err) {
            callback(err, []);
            return;
        }

        rows.forEach(function(e) {
            var confi = fs.readFileSync(paths.factorioDir + "server" + e.serverID + paths.conf);
            var conf = JSON.parse(confi);
            item = {
                id: e.serverID,
                conf: conf
            };

        });
        callback(null, item);
    });
};
