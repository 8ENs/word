angular.module('word.services', ['word'])

.factory('Pins', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var pins = [];
  var ctr = 0;
  $.getJSON("/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=jody", function(pulledPins) {
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

    //   id: 0,
    // name: 'Ben Sparrow',
    // lastText: 'You on your way?',
    // face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'

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
