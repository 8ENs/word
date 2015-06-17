angular.module('starter.directives', [])

.directive('map', function() {


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
  currentPin = null;
  pos = new google.maps.LatLng(0, 0);
  
  return {
    restrict: 'E',
    scope: {
      onCreate: '&'
    },
    link: function ($scope, $element, $attr) {
      function initialize() {
        var mapOptions = {
          zoom: 14,
          disableDefaultUI: true
        };
        map = new google.maps.Map($element[0], mapOptions);

        $scope.onCreate({map: map});

        // Stop the side bar from dragging when mousedown/tapdown on the map
        google.maps.event.addDomListener($element[0], 'mousedown', function (e) {
          e.preventDefault();
          return false;
        });
      
        // Try HTML5 geolocation
        if(navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {

            // Initialize
            var pins = [];
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            pos = new google.maps.LatLng(lat, lng);

            // Add a current location to the Map
            addCurrentGeo();

            // Add public markers to map
            addPublicMarkers();

            map.setCenter(pos);

            google.maps.event.addListener(currentLocation, 'dragend', function(event) {
              pos = new google.maps.LatLng(event.latLng.A, event.latLng.F);
              
              // if on Explore tab this re-orders the current list dynamically by new order
              // renderPins();

              // comment out until we have a place to show info about pin
              // if (currentPin != null) {
              //   renderPin(currentPin);
              // };

              // clear all markers, re-add current location & public markers, then add others in relation to new pos
              for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
              }
              addPublicMarkers();

              if (currentUser != null) {
                $.getJSON(API_HOST + "/api/Pins?filter[where][type]=public&filter[where][status]=saved", function(pins) {
                  pins.forEach(function(pin) {
                    markers.forEach(function(marker) {
                      if (marker.title == pin.id) {
                        marker.setIcon(blue_pin);
                      }
                    });
                  });
                });

                // grab all pins (+ wUser) where type=private && recipient=currentUser
                $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.username, function(pins) {
                
                  // loop through all pins and add them to map with 'title' as their id
                  for (var i = 0; i < pins.length; i++) {
                    addMarkerWithTimeout2(pins[i], i * 200)
                  }

                });
              }
            });

          }, function() {
            handleNoGeolocation(true);
          });
        } else {
          // Browser doesn't support Geolocation
          handleNoGeolocation(false);
        }

      } // initialize end

      function addMarkerWithTimeout2(pin, timeout) {
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
            onPinClick(marker);
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

      function handleNoGeolocation(errorFlag) {
        console.log(errorFlag);
        if (errorFlag) {
          var content = 'Error: The Geolocation service failed.';
        } else {
          var content = 'Error: Your browser doesn\'t support geolocation.';
        }

        var options = {
          map: map,
          position: new google.maps.LatLng(60, 105),
          content: content
        };

        var infowindow = new google.maps.InfoWindow(options);
        map.setCenter(options.position);
      }

      function addCurrentGeo() {
        currentLocation = new google.maps.Marker({
          map: map,
          position: pos,
          draggable: true, // need to update lat/lng if draggable enabled
          icon: current_loc_icon,
          zIndex: google.maps.Marker.MAX_ZINDEX + 1
        });
      }

      function addPublicMarkers() {
        $.getJSON(API_HOST + "/api/Pins?filter[where][type]=public", function(pins) {
          pins.forEach(function(pin) {
            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
              title: pin.id,
              map: map,
              icon: blue_pin_50,
              type: pin.type
            });
            markers.push(marker);
            google.maps.event.addListener(marker, 'click', function() {
              onPinClick(marker);
            });
          });
        });
      }

      function onPinClick(marker) {
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

      if (document.readyState === "complete") {
        initialize();
      } else {
        google.maps.event.addDomListener(window, 'load', initialize);
      }
    }
  }
});