
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
              console.log("la lista regresa "+view_res);
            //db.view('view_positions/all', function(view_err, view_res){
              // The list doesn't exists. Create it.
              if(view_err.reason == 'missing_named_view'){
                db.save('_design/view_positions', {
                  views: {
                    all: {
                      map: function(doc){
                        if (doc.lat && doc.lng && doc.time && (doc.vel != undefined)){
                          emit(doc._id, '{\"lat\": '+doc.lat+', \"lng\":'+doc.lng+', \"time\":'+doc.time+', \"vel\":'+doc.vel+'}');
                        }
                        if (doc.lat && doc.lng && doc.time && (doc.vel == undefined)){
                          emit(doc._id, '{\"lat\": '+doc.lat+', \"lng\":'+doc.lng+', \"time\":'+doc.time+', \"vel\":-1}');
                        }
                      }
                    }	
                  },
                  lists: {
                    active: function(head, req){
                      var jsonobj;
                      var resp = '[';
                      if (req.query.now){
                        while(row = getRow()) {
                          jsonobj = eval('('+row.value+')');
                          if ((jsonobj.time +300000) > req.query.now){
                            resp += '{\"lat\":'+jsonobj.lat+',\"lng\":'+jsonobj.lng+', \"vel\":'+jsonobj.vel+'},';
                          }
                        }
                        if (resp.length > 1) resp = resp.substring(0, resp.length -1);
                      }	
                      resp += ']';
                      send(resp);
                    }
                  }
                });
                // return empty list. next time update is called, the list will exist.
                res.send('[]');
              } else {
                console.log("la lista regresa "+view_res);
                res.send(JSON.stringify(view_res));
              }
            });
          }
        });   
      }
    });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3001);
  
  // create view if it doesn't exist
  var cradle = require('cradle');
  var db = new(cradle.Connection)().database('helpmetraffic');
  db.list('view_positions/active/all', function(view_err, view_res){
    if(view_err.reason == 'missing_named_view'){
      db.save('_design/view_positions', {
        views: {
	  all: {
	    map: function(doc){
	      if (doc.lat && doc.lng && doc.time && (doc.vel != undefined)){
	        emit(doc._id, '{\"lat\": '+doc.lat+', \"lng\":'+doc.lng+', \"time\":'+doc.time+', \"vel\":'+doc.vel+'}');
	      }
              if (doc.lat && doc.lng && doc.time && (doc.vel == undefined)){
		emit(doc._id, '{\"lat\": '+doc.lat+', \"lng\":'+doc.lng+', \"time\":'+doc.time+', \"vel\":-1}');
	      }
	    }
	  }	
	},
	lists: {
	  active: function(head, req){
	    var jsonobj;
	    var resp = '[';
	    if (req.query.now){
	      while(row = getRow()) {
		jsonobj = eval('('+row.value+')');
		if ((jsonobj.time +300000) > req.query.now){
		  resp += '{\"lat\":'+jsonobj.lat+',\"lng\":'+jsonobj.lng+', \"vel\":'+jsonobj.vel+'},';
		}
	      }
	      if (resp.length > 1) resp = resp.substring(0, resp.length -1);
	    }			
	    resp += ']';
            send(resp);
	  }
	}
      });
    }
  });
  console.log("Express server listening on port %d", app.address().port);
}
