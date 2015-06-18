angular.module('word.services', [])

.factory('Pins', function() {
  currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

  var pins = [];
  var ctr = 0;
  $.getJSON("/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.firstname.toLowerCase(), function(pulledPins) {
    pulledPins.forEach(function(onePin){
      pins.push({
        id: ctr,
        name: onePin.name,
        message: onePin.message,
        face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
      });
      ctr++;
    });
  });


  return {
    all: function() {
      return pins;
    },
    remove: function(pin) {
      pins.splice(pins.indexOf(pin), 1);
    },
    get: function(pinId) {
      for (var i = 0; i < pins.length; i++) {
        if (pins[i].id === parseInt(pinId)) {
          return pins[i];
        }
      }
      return null;
    }
  };
});
