  //navigator.geolocation.getCurrentPosition(handle_position, handle_error);
  var first_time = 1;
  var pins = [];
  var google_map;
  var zoom = 14;
  var center;

  function handle_error(error){
    alert("Error retreiving position");
  }

  function handle_position(position){
    lat = position.coords.latitude;
    long = position.coords.longitude;
    var container = document.getElementById('container');
    var paragraph = document.createElement('p');
    paragraph.innerHTML = "Your position is lat:"+lat+", long:"+long;
    container.appendChild(paragraph);
    //draw_map(lat, long);
  }

  function clear_map() {
    if (pins) {
      for (i in pins) {
        pins[i].setMap(null);
      }
    }
  }

  function draw_map(coords){
    if (first_time == 1){
      first_time = 0;
      //var my_google_pos = new google.maps.LatLng(my_latitude, my_longitude);
      //center = my_google_pos;
      var map_args = {
        zoom: zoom,
        center: center,
        mapTypeControl: false,
        navigationControlOptions: {style:google.maps.NavigationControlStyle.SMALL},
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      var map_container = document.getElementById('map_container');
      map_container.style.height = '350px';
      map_container.style.width = '300px';
      google_map = new google.maps.Map(map_container, map_args);
      google.maps.event.addListener(google_map, 'zoom_changed', function() {
        zoom = google_map.getZoom();
      });
      google.maps.event.addListener(google_map, 'center_changed', function() {
        //alert("center changed");
        center = google_map.getCenter();
      });
    } else {
      clear_map();
      google_map.setZoom(zoom);
      google_map.setCenter(center);
    }

    coords.forEach(function(position){
      var vel = position.vel;
      var pin_icon;
      if (vel < 10) {
        pin_icon = new google.maps.MarkerImage('/img/vslow.png');
      } else {
        if (vel < 30) {
          pin_icon = new google.maps.MarkerImage('/img/slow.png');
        } else {
          if (vel < 40) {
            pin_icon = new google.maps.MarkerImage('/img/savrg.png');
          } else {
            if (vel < 50) {
              pin_icon = new google.maps.MarkerImage('/img/avrg.png');
            } else {
              if (vel < 60) {
                pin_icon = new google.maps.MarkerImage('/img/favrg.png');
              } else {
                if (vel < 80) {
                  pin_icon = new google.maps.MarkerImage('/img/fast.png');
                } else {
                  pin_icon = new google.maps.MarkerImage('/img/vfast.png');
                }
              } 
            } 
          } 
        } 
      } 
      var google_pos = new google.maps.LatLng(position.lat, position.lng);
      var pin = new google.maps.Marker({
        position: google_pos,
        map: google_map,
        icon: pin_icon
      });
      pins.push(pin);
    });
  }

  function supports_html5_storage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  var userId = undefined;
  var my_latitude = undefined;
  var my_longitude = undefined;
  var interval_update = undefined;
  function check(){
    if(supports_html5_storage()) {
      userId = localStorage.getItem("helpMeTrafficId");
      if(userId == undefined) show_form();
      else interval_update = setInterval(update, 15000);   
    }
    else {
      alert('Unsupported browser!');
    }
  }

  function show_form(){
    var select = $('#yob');
    var opt;
    for (var i = 2010; i >= 1930; i--){
      $('<option value='+i+'>'+i+'</option>').appendTo('#yob');
    }
    $('#sex').selectmenu('refresh', true);
    $('#yob').selectmenu('refresh', true);
    $('#sex').trigger("change");
    $('#yob').trigger("change");

    $('#loading').fadeOut('slow');
    $('#site_body').css('display', 'none');
    $('#registry_form').css('display', 'block');
  }
  
  function update() {
    navigator.geolocation.getCurrentPosition(function(position){
      my_latitude = position.coords.latitude;
      my_longitude = position.coords.longitude;
      if (first_time == 1){center = new google.maps.LatLng(my_latitude, my_longitude);}

      $.ajax({
        type: 'post',
        url: '/update',
        data: {id:userId,latitude:my_latitude,longitude:my_longitude,time:(new Date()).getTime()},
        datatype : 'html',
        success: function(data) {      
          console.log('response del update:'+data)
          if (eval('('+data+')').response){
            clearInterval(interval_update);
            show_form();
          } else {
            $('#loading').fadeOut('slow');
            $('#registry_form').css('display', 'none');
            $('#site_body').css('display', 'block');
            draw_map(eval('('+data+')'));
          }
        } 
      });
      /*$.post('/update', {id:userId,latitude:my_latitude,longitude:my_longitude,time:(new Date()).getTime()},     function(data) {      
        console.log('response del update:'+data)
        if (eval('('+data+')').response){
          show_form();
        } else {
          draw_map(eval('('+data+')'));
        }
      })*/
    }, handle_error);
  }
  
  function register() {
    userId = undefined;
    var sex = $('#sex').val();
    var yob = $('#yob').val();
    var valid = 1;
    if (sex == "0" || yob == "0"){
      alert("Both fields are required");
      valid = 0;
    }
    if (valid == 1){
      $.ajax({
        type:'post',
        url:'/register',
        data: {device:navigator.platform,sex:sex,yob:yob},
        dataType: "html",
        success: [ 
          function(data){
            data = eval(data);
            userId = data;
            localStorage.setItem("helpMeTrafficId",data);
          }, 
          function(){
            $('#registry_form').hide();
            $('#loading').fadeIn('slow');
          },
          setInterval(update, 15000) ]
      });
    }
  }
  
  $(document).ready( function(){
    
    $(document).bind("mobileinit", function(){$.mobile.selectmenu.prototype.options.nativeMenu = true;});
    $('#btnRegister').bind('click', register);
    check()}
  );
