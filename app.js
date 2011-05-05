
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Help Me Traffic'
  }
);
});

app.post('/register', function(req, res){
  
  
  //Generate unique key  
  var cradle = require('cradle');
  var db = new(cradle.Connection)().database('helpmetraffic');
  console.log(req.body);
  mensaje = '{}';
  db.save('llave', {
      force: 'light',
      name: 'Luke Skywalker'
  }, function (err, res) {
      if (err) {
        mensaje = '{response:"ERROR"}';
      } else {
        mensaje = '{response:"OK"}';      
      }
  });  	  
  res.send(mensaje);  
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
