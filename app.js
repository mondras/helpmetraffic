
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
  var id = req.body.id;
  var rev;
  var lat1, lat2, lng1, lng2, time1, time2, vel;
  //find user
  db.get(id, function (err,doc) {
      // update user
      if(doc==undefined){ res.send('{response:"ERROR"}');}
      if(!err && doc!= undefined){
        rev = doc._rev;
        lat1 = doc.lat;
        lng1 = doc.lng;
        time1 = doc.time;
        lat2 = req.body.latitude;
        lng2 = req.body.longitude;
        time2 = req.body.time;
        if (lat1 && lng1 && time1){
          if ((time2 - time1) <= 60000){
            // calculate distance
            var R = 6371; 
            var dLat = (lat2-lat1)*Math.PI / 180;
            var dLon = (lng2-lng1)*Math.PI / 180; 
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1*Math.PI / 180) * Math.cos(lat2*Math.PI / 180) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2); 
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            var d = R * c
            vel = (d/((time2-time1)/1000))*3600;
            console.log("velocidad "+vel);
          }
        } 
        db.save(id, rev, {
          device:doc.device,
          sex: doc.sex,
          yob: doc.yob,
          lat: lat2,
          lng: lng2,
          time: time2,
          vel: vel
        }, function (error, response) {
          if (error) {
	    console.log("Error al guardar nueva pos");
            res.send(error);
          } else {
            // send all users' info
            var now = (new Date()).getTime();
            db.list('view_positions/active/all', {now: now}, function(view_err, view_res){
            //db.view('view_positions/all', function(view_err, view_res){
              console.log("la lista regresa "+view_res);
              res.send(JSON.stringify(view_res));
            });
          }
        });   
      }
    });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}



if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}
