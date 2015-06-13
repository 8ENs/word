var pos = new google.maps.LatLng(0,0);
var map;
var markers = [];
var pin_icon = 'http://www.google.com/mapmaker/mapfiles/marker-k.png'
var current_loc_icon = 'https://www.google.com/support/enterprise/static/geo/cdate/art/dots/blue_dot.png'

function initialize() {
  var mapOptions = {
    zoom: 14
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);

  // Try HTML5 geolocation
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {

      // Initialize
      var pins = [];
      pos = new google.maps.LatLng(position.coords.latitude,
                                       position.coords.longitude);

      // Add a current location to the Map
      var currentLocation = new google.maps.Marker({
        map: map,
        position: pos,
        draggable: true, // need to update lat/lng if draggable enabled
        icon: current_loc_icon,
        zIndex: google.maps.Marker.MAX_ZINDEX + 1
      });

      map.setCenter(pos);

      // Add a pins to the Map
      $.getJSON( "/api/Pins", function( data ) {
        pins = data;

        // loop through all pins and add them to map with 'title' as their id
        pins.forEach(function(pin) {
          var location = new google.maps.LatLng(pin.coords.lat, pin.coords.lng);
          var marker = new google.maps.Marker({
            position: location,
            title: pin.id,
            map: map,
            icon: pin_icon
          });
          markers.push(marker);
        });
      });

      google.maps.event.addListener(currentLocation, 'dragend', function(event) {
        pos = new google.maps.LatLng(event.latLng.A, event.latLng.F);
        $("#lat").val(event.latLng.A);
        $("#lng").val(event.latLng.F);
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
