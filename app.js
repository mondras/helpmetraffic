
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
  var cradle = require('cradle');
  var db = new(cradle.Connection)().database('helpmetraffic');
  db.save({
      device: req.body.device,
      sex: req.body.sex,
      yob: req.body.yob
  }, function (error, response) {
      if (error) {
        res.send('{response:"ERROR"}');
      } else {
        res.send('{id:"'+response.id+'"}');
      }
  });  	  
});

app.post('/update', function(req,res) {
  var cradle = require('cradle');
  var db = new(cradle.Connection)().database('helpmetraffic');
  //find user
  db.get(req.body.id, function (err,doc) { 
      console.log("Retriveo:"+doc);
    });
    
  //Update it
  
  //Agregate it?
  
  //Send a list of all other users
  res.send('');
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
