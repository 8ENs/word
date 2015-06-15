var markers = [];
var red_pin = '../images/red_pin.png';
var green_pin = '../images/green_pin.png';
var yellow_pin = '../images/yellow_pin.png';
var red_pin_50 = '../images/red_pin_50.png';
var green_pin_50 = '../images/green_pin_50.png';
var yellow_pin_50 = '../images/yellow_pin_50.png';
var gray_pin_50 = '../images/gray_pin_50.png';
var current_loc_icon = '../images/blue_dot.png';

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
      var currentLocation = new google.maps.Marker({
        map: map,
        position: pos,
        draggable: true, // need to update lat/lng if draggable enabled
        icon: current_loc_icon,
        zIndex: google.maps.Marker.MAX_ZINDEX + 1
      });

      // Add public markers to map
      $.getJSON("/api/Pins?filter[where][type]=public", function(pins) {
        pins.forEach(function(pin) {
          markers.push(new google.maps.Marker({
            position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
            title: pin.id,
            map: map,
            icon: yellow_pin,
            type: pin.type
          }));
        });
      });

      map.setCenter(pos);

      google.maps.event.addListener(currentLocation, 'dragend', function(event) {
        pos = new google.maps.LatLng(event.latLng.A, event.latLng.F);
        renderPins();
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

google.maps.event.addDomListener(window, 'load', initialize);
