angular.module('word.services', [])

.factory('Pins', function() {
  var initialPullPinsURL = "/api/Pins?filter[where][type]=public&filter[where][status]=saved";
  currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (currentUser != null || currentUser != undefined){
    initialPullPinsURL = "/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.firstname.toLowerCase();
  }
  var pins = [];
  var ctr = 0;
  $.getJSON(initialPullPinsURL, function(pulledPins) {
    pulledPins.forEach(function(onePin){
      pins.push($.extend(onePin, {
        id: ctr,
        internalId: onePin.id,
        senderName: onePin.wUser.firstname,
        message: onePin.message,
        face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
      }));
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
