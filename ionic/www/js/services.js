angular.module('word.services', [])

.factory('Pins', 
  function() {
    // no access to pos, we need the initial coords to be saved globally somewhere
    // var initialPullPinsURL = "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng + "filter[where][type]=public&filter[where][status]=saved";
    var here = '43,-123'; // $scope.pos.A + "," + $scope.pos.F;
    
    currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (currentUser != null){
      initialPullPinsURL = API_HOST + "/api/Pins?filter[where][coords][near]=" + here + "&filter[include]=wUser&filter[where][or][0][type]=public&filter[where][or][1][recipient]=" + currentUser.username.toLowerCase();
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
  }
);
