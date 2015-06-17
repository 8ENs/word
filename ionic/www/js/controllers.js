angular.module('starter.controllers', [])

.controller('MapCtrl', function($scope, $state) {
  var blue_pin = API_HOST + '/images/blue_pin.png';
  var blue_pin_50 = API_HOST + '/images/blue_pin_50.png';
  var green_pin = API_HOST + '/images/green_pin.png';
  var green_pin_50 = API_HOST + '/images/green_pin_50.png';
  var yellow_pin = API_HOST + '/images/yellow_pin.png';
  var yellow_pin_50 = API_HOST + '/images/yellow_pin_50.png';
  var red_pin = API_HOST + '/images/red_pin.png';
  var red_pin_50 = API_HOST + '/images/red_pin_50.png';
  var gray_pin_50 = API_HOST + '/images/gray_pin_50.png';
  var current_loc_icon = API_HOST + '/images/blue_dot.png';

  accessToken = null;
  currentUser = null;
  var pins = [];
  pos = new google.maps.LatLng(49.282123, -123.108421); 

  $scope.mapCreated = function(map) {
    $scope.map = map;
  }

  $scope.login = function () {
    var loginEmail = $( "#loginEmail" ).val();
    var loginPassword = $( "#loginPassword" ).val();
    var loginData = {email: loginEmail, password: loginPassword};
    
    $.post( API_HOST + "/api/wUsers/login", loginData, function(auth) {
      accessToken = auth.id;
      $.get( API_HOST + "/api/wUsers/" + auth.userId, function(userJson) {
        currentUser = userJson;
        $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.username, function(pins) {

        for (var i = 0; i < pins.length; i++)
          addMarkerWithTimeout(pins[i], i * 200);
        });
        if (currentUser != null) {
          $state.go('main');
        }
      });
    });
    upgradePublicSaved();
  }

  function upgradePublicSaved() {
    $.getJSON(API_HOST + "/api/Pins?filter[where][type]=public&filter[where][status]=saved", function(pins) {
      pins.forEach(function(pin) {
        markers.forEach(function(marker) {
          if (marker.title == pin.id) {
            marker.setIcon(blue_pin);
          }
        });
      });
    });
  }

  $scope.logout = function () {
    // $.post(API_HOST + "/api/wUsers/logout?access_token=" + accessToken, null, function(){
      accessToken = null;
      currentUser = null;
    // })

    var i = markers.length;
    while (i--) {
      if (markers[i].type != 'public') {
        markers[i].setMap(null);
        markers.splice(i, 1);
      } else {
        markers[i].setIcon(blue_pin_50)
      }
    }

    $state.go('welcome');
  } 

  $scope.dropPin = function () {
    var recipient = $("#recipient").val();
    var newPin;
    var newPinId;
    $.getJSON(API_HOST + "/api/wUsers?filter[where][username]=" + recipient, function(user) {
      if (currentUser != null && user.length > 0) {
        var message = $("#message").val();
        var type = "private".toLowerCase();
        var status = 'discovered';
        var coords = {lat: pos.A, lng: pos.F};

        newPin = {recipient: recipient, message: message, coords: coords, type: type, status: status};
        // debugger
      }
    })
    .then(function() {
      $.post( API_HOST + "/api/wUsers/" + currentUser.id + "/pins", newPin, function (pin) {
        newPinId = pin.id;

        $.getJSON(API_HOST + "/api/Pins/" + newPinId, function(pin) {
          ico = (pin.type == 'public') ? yellow_pin : red_pin;

          var marker = new google.maps.Marker({
            position: pos,
            title: newPinId,
            map: map,
            icon: ico,
            type: pin.type,
            animation: google.maps.Animation.DROP
          });
          markers.push(marker);
          google.maps.event.addListener(marker, 'click', function() {
            onPinClick(marker);
          });
        });
      });

        // $(".dropped" ).fadeIn('slow').fadeOut('slow');
        // $("#recipient" ).val('');
        // $("#message" ).val('');
        // $("#pinType" ).val('private');
      // } else {
      //   $("#recipient").val('NEED VALID USERNAME');
      // }
    })
    .then(function() {
      $state.go('main');
    });
  }

  $scope.renderPins = function () {
    // clear old list of pins
    $("#pin_list").empty();

    // get all pins which were dropped TO/FOR the currentUser (including public)
    
    var here = pos.A + "," + pos.F
    if (currentUser != null) {
      $.getJSON( "/api/Pins?filter[where][coords][near]=" + here + "&filter[include]=wUser&filter[where][or][0][type]=public&filter[where][or][1][recipient]=" + currentUser.username, function(pins) {
        iterator(pins);
      });
    }
  }

  // destroy the database entry (no error handling for id not found)
  // $( "#delete" ).on( "click", function() {
  //   var id = $( "#delete_id" ).val();
  //   $.ajax({
  //     url: '/api/Pins/' + id,
  //     type: 'DELETE',
  //     success: function(response) {

  //       // must be an easier way to search through or filter for specific pin
  //       for (var i = markers.length - 1; i >= 0; i--) {
  //         if (markers[i].title == id) {
  //           // remove the marker from map
  //           markers[i].setMap(null);
  //           // remove the instance from array
  //           markers.splice(i, 1);
  //         }
  //       }

  //       $("#delete_id").val('');
  //       $("#msg_deleted").fadeIn('slow').fadeOut('slow');
  //     }
  //   });
  // });

  // function renderPin(pin) {
  //   // clear old list
  //   // $(".view").hide();
  //   $("#pin_list").empty();

  //   if (currentUser != null) {
  //     iterator([pin]);
  //   }
  // }

  // generate list
  function iterator(pins) {
    $.each(pins, function(idx, pin) {
      
      $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
        var distToPin = Math.round(dist.distance);

        // if (pin.status == 'saved') {
          var pin_formatted =
            "<b><li id='" + pin.id + "'>" + pin.message + " (" + pin.id + ")</li></b>"
            + "<ul>"
              + "<li>From: " + pin.wUser.firstname + ' ' + pin.wUser.lastname + "</li>"
              + "<li>Type: " + pin.type + "</li>"
              + "<li>Status: " + pin.status + "</li>"
              + "<li>Distance: " + Math.round(dist.distance) + " m</li>"
            + "</ul>";
          list(pin_formatted);
        // } else if (distToPin < 250) {
        //   $("#pin_list").append("<b>You are close enough! Touch the pin to open.");
        // } else {
        //   $("#pin_list").append("<b>You need to be " + (distToPin - 250) + " m closer to open this pin!");
        // }
      });
    });
  }

  // display list
  function list(line) {
    $("#pin_list").append(line);
  }

  function addMarkerWithTimeout(pin, timeout) {
    $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
        title: pin.id,
        map: map,
        icon: green_pin,
        type: pin.type
      });
      markers.push(marker);
      google.maps.event.addListener(marker, 'click', function() {
        onPinClick2(marker);
      });

      if (pin.status == 'saved') {
        // do nothing
      } else if (Math.round(dist.distance) < 250) {
        marker.setIcon(green_pin_50);
      } else if (pin.status == 'discovered') {
        marker.setIcon(gray_pin_50);
      }

    });
  }

  function onPinClick2(marker) {
    if (currentUser != null) {
      $.getJSON(API_HOST + "/api/Pins/" + marker.title + "?filter[include]=wUser", function(pin) {
        currentPin = pin;
        $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {

          $(".view").hide();
          $("#pin_list").empty();

          var distToPin = Math.round(dist.distance);

          if (distToPin < 250 && pin.status == 'discovered') {
            pin.status = 'saved';

            $.ajax({
              url: API_HOST + "/api/Pins/" + pin.id,
              type: 'PUT',
              data: {"status": "saved"}
            });

            if (marker.type == 'private') {
              marker.setIcon(green_pin);
            } else if (marker.type == 'public') {
              marker.setIcon(blue_pin);
            } 
          } 
          
          // iterator([pin]);

          $("#div_explore").show();
        });
      });
    }
  }

  // function initialize2() {
  //   if(navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(function(position) {

  //       // Initialize
  //       var lat = position.coords.latitude;
  //       var lng = position.coords.longitude;
  //       pos = new google.maps.LatLng(lat, lng);

  //       google.maps.event.addListener(currentLocation, 'dragend', function(event) {
  //         pos = new google.maps.LatLng(event.latLng.A, event.latLng.F);
  //       });

  //     }, function() {
  //       handleNoGeolocation(true);
  //     });
  //   } else {
  //     // Browser doesn't support Geolocation
  //     handleNoGeolocation(false);
  //   }
  // }

  // if (document.readyState === "complete") {
  //   initialize2();
  // } else {
  //   google.maps.event.addDomListener(window, 'load', initialize2);
  // }

});
