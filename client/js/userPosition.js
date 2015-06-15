var markers = [];
var blue_pin = '../images/blue_pin.png';
var blue_pin_50 = '../images/blue_pin_50.png';
var green_pin = '../images/green_pin.png';
var green_pin_50 = '../images/green_pin_50.png';
var yellow_pin = '../images/yellow_pin.png';
var yellow_pin_50 = '../images/yellow_pin_50.png';
var red_pin = '../images/red_pin.png';
var red_pin_50 = '../images/red_pin_50.png';
var gray_pin_50 = '../images/gray_pin_50.png';
var current_loc_icon = '../images/blue_dot.png';
pos = new google.maps.LatLng(0, 0);

function initialize() {
  var mapOptions = {
    zoom: 14,
    disableDefaultUI: true
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);

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
        renderPins();

        // clear all markers, re-add current location & public markers, then add others in relation to new pos
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(null);
        }
        addPublicMarkers();

        if (currentUser != null) {
          upgradePublicSaved();

          // grab all pins (+ wUser) where type=private && recipient=currentUser
          $.getJSON("/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.username, function(pins) {
          
            // loop through all pins and add them to map with 'title' as their id
            for (var i = 0; i < pins.length; i++)
              addMarkerWithTimeout(pins[i], i * 200)

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
  $.getJSON("/api/Pins?filter[where][type]=public", function(pins) {
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
  window.alert(marker.title);
}

function upgradePublicSaved() {
  $.getJSON("/api/Pins?filter[where][type]=public&filter[where][status]=saved", function(pins) {
    pins.forEach(function(pin) {
      markers.forEach(function(marker) {
        if (marker.title == pin.id) {
          marker.setIcon(blue_pin);
        }
      });
    });
  });
}

google.maps.event.addDomListener(window, 'load', initialize);
