
/**
 * Bootstrap app.
 */


/**
 * Module dependencies.
 */

var express = require('express');
var stylus = require('stylus');
var nib = require('nib');
var sio = require('socket.io');

/**
 * App.
 */

var app = express.createServer();

/**
 * App configuration.
 */

app.configure(function () {
   
  app.use(app.router);
  app.use(stylus.middleware({ src: __dirname + '/public', compile: compile}));
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname);
  app.set('view engine', 'jade');

  function compile(str, path) {
    return stylus(str)
      .set('filename', path)
      .use(nib());
  }
});

/**
 * App routes.
 */

app.get('/', function (req, res) {
  console.log("Setting up route using: " + req + ", " + res);
  res.render('index', { layout: false });
});

/**
 * App listen.
 */
  
var port = 3000;
if (process.env.PORT) { port = process.env.PORT;}

app.listen(port, function () {
  var addr = app.address();
  console.log('   app listening on http://' + addr.address + ':' + addr.port);
});

/**
 * Socket.IO server (single process only)
 */

var io = sio.listen(app)
  , nicknames = {};

// polling only for iis
io.configure(function() {
   io.set('transports', ['xhr-polling']);
   io.set('log level', 5);
});

io.sockets.on('connection', function (socket) {
  socket.on('user message', function (msg) {
    socket.broadcast.emit('user message', socket.nickname, msg);
  });

  socket.on('nickname', function (nick, fn) {
    if (nicknames[nick]) {
      fn(true);
    } else {
      fn(false);
      nicknames[nick] = socket.nickname = nick;
      socket.broadcast.emit('announcement', nick + ' connected');
      io.sockets.emit('nicknames', nicknames);
    }
  });

  socket.on('disconnect', function () {
    if (!socket.nickname) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});
