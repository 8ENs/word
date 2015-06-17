(function() {
  window.API_HOST = '';

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

  angular.module('word', ['ionic'])
  .config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
      .state('home', {
        url: '/',
        controller: 'HomeCtrl',
        templateUrl: 'home.html'
      })
      .state('item', {
        url: '/:item',
        controller: 'ItemCtrl',
        templateUrl: 'item.html'
      });

    $urlRouterProvider.otherwise('/');
  })
  .controller('HomeCtrl', function($scope, $ionicSideMenuDelegate, $ionicModal) {

    accessToken = null;
    currentUser = null;
    markers = [];
    // pins = [];
    currentPin = null;
    pos = new google.maps.LatLng(49.282123, -123.108421); 

    $ionicModal.fromTemplateUrl('modal.html', {
      animation: 'slide-in-up',
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });
    
    $scope.openMenu = function () {
      $ionicSideMenuDelegate.toggleLeft();
    }
    
    $scope.openModal = function () {
      $scope.modal.show();
    }
    
    $scope.form = {};  // ???
    
    $scope.login = function () {
      var loginEmail = $( "#loginEmail" ).val();
      var loginPassword = $( "#loginPassword" ).val();
      var loginData = {email: loginEmail, password: loginPassword};
      
      $.post( API_HOST + "/api/wUsers/login", loginData, function(auth) {
        accessToken = auth.id;
        $.get( API_HOST + "/api/wUsers/" + auth.userId, function(userJson) {
          currentUser = userJson;
          $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.username, function(pins) {
            $("#pin_list").text('Welcome ' + currentUser.firstname + '. Time to get crackin!');
            for (var i = 0; i < pins.length; i++)
              $scope.addMarkerWithTimeout(pins[i], i * 200)
          });
        });
      });
      $scope.modal.hide();
      $scope.upgradePublicSaved();
      $("#nav_drop").show();
      $("#nav_explore").show();
      $("#nav_logout").show();
      $("#nav_login").hide();
      $("#nav_register").hide();
    }
    
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

  })
  .controller('ItemCtrl', function ($scope, $stateParams) {
    $scope.item = $stateParams.item;
  })
  .controller('MapCtrl', function($scope, $ionicLoading, $compile) {

    function initialize() {
      var mapOptions = {
        disableDefaultUI: true,
        zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(document.getElementById("map"), mapOptions);

      $scope.map = map;
    }
    google.maps.event.addDomListener(window, 'load', initialize);


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

        // Center
        map.setCenter(pos);

        google.maps.event.addListener(currentLocation, 'dragend', function(event) {
          pos = new google.maps.LatLng(event.latLng.A, event.latLng.F);
        
          // if on Explore tab this re-orders the current list dynamically by new order
          // renderPins();

          if (currentPin != null) {
            $scope.renderPin(currentPin);
          };

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
                $scope.addMarkerWithTimeout(pins[i], i * 200)
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
        draggable: true,
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
            $scope.onPinClick(marker);
          });
        });
      });
    }    

    $scope.upgradePublicSaved = function () {
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

    $scope.addMarkerWithTimeout = function (pin, timeout){
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
          $scope.onPinClick(marker);
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

    $scope.onPinClick = function(marker){
      if (currentUser != null) {
        $.getJSON(API_HOST + "/api/Pins/" + marker.title + "?filter[include]=wUser", function(pin) {
          currentPin = pin;
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {

            // $(".view").hide();
            // $("#pin_list").empty();

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
            
            $scope.iterator([pin]);
          });
        });
      }
    }

    $scope.iterator = function(pins) {
      $.each(pins, function(idx, pin) {
        $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
          var distToPin = Math.round(dist.distance);
            // $("#pin_list").empty();
          if (pin.status == 'saved') {
            $("#pin_list").text("MSG: " + pin.message + " | FROM: " + pin.wUser.firstname + " | TYPE: " + pin.type + " | STATUS: " + pin.status + " | DIST: " + Math.round(dist.distance));
            // var pin_formatted =
            //   "<b><li id='" + pin.id + "'>" + pin.message + " (" + pin.id + ")</li></b>"
            //   + "<ul>"
            //     + "<li>From: " + pin.wUser.firstname + ' ' + pin.wUser.lastname + "</li>"
            //     + "<li>Type: " + pin.type + "</li>"
            //     + "<li>Status: " + pin.status + "</li>"
            //     + "<li>Distance: " + Math.round(dist.distance) + " m</li>"
            //   + "</ul>";
            // list(pin_formatted);
          } else if (distToPin < 250) {
            $("#pin_list").text("You are close enough! Touch the pin to open.");
          } else {
            $("#pin_list").text("You need to be " + (distToPin - 250) + " m closer to open this pin!");
          }
        });
      });
    }

    // display list
    $scope.list = function (line) {
      $("#pin_list").append(line);
    }

    $scope.renderPin = function (pin) {
      // clear old list
      // $(".view").hide();
      // $("#pin_list").empty();

      if (currentUser != null) {
        $scope.iterator([pin]);
      }
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

        // } else {
        //   $("#recipient").val('NEED VALID USERNAME');
        // }
      });
    }

    $scope.logout = function () {
      $.post(API_HOST + "/api/wUsers/logout?access_token=" + accessToken, null, function(){
        accessToken = null;
        currentUser = null;
      })

        var i = markers.length;
        while (i--) {
          if (markers[i].type != 'public') {
            markers[i].setMap(null);
            markers.splice(i, 1);
          } else {
            markers[i].setIcon(blue_pin_50)
          }
        }
      $("#pin_list").text("Welcome. Please login.")
      $("#nav_drop").hide();
      $("#nav_explore").hide();
      $("#nav_logout").hide();
      $("#nav_login").show();
      $("#nav_register").show();
      }
  });
}());

// angular.module('word', ['ionic'])
// .controller('MapCtrl', function($scope, $ionicLoading, $compile) {
//   function initialize() {
//     var mapOptions = {
//       zoom: 14,
//       disableDefaultUI: true
//     };
//     var map = new google.maps.Map(document.getElementById("map"), mapOptions);

//     $scope.onCreate({map: map});

//     // Stop the side bar from dragging when mousedown/tapdown on the map
//     // google.maps.event.addDomListener($element[0], 'mousedown', function (e) {
//     //   e.preventDefault();
//     //   return false;
//     // });
  
//     // Try HTML5 geolocation
//     if(navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(function(position) {

//         // Initialize
//         var pins = [];
//         var lat = position.coords.latitude;
//         var lng = position.coords.longitude;
//         var pos = new google.maps.LatLng(lat, lng);

//         // Add a current location to the Map
//         addCurrentGeo();

//         // Add public markers to map
//         addPublicMarkers();

//         map.setCenter(pos);

//         google.maps.event.addListener(currentLocation, 'dragend', function(event) {
//           pos = new google.maps.LatLng(event.latLng.A, event.latLng.F);
          
//           // if on Explore tab this re-orders the current list dynamically by new order
//           // renderPins();

//           // comment out until we have a place to show info about pin
//           // if (currentPin != null) {
//           //   renderPin(currentPin);
//           // };

//           // clear all markers, re-add current location & public markers, then add others in relation to new pos
//           for (var i = 0; i < markers.length; i++) {
//             markers[i].setMap(null);
//           }
//           addPublicMarkers();

//           if (currentUser != null) {
//             $.getJSON(API_HOST + "/api/Pins?filter[where][type]=public&filter[where][status]=saved", function(pins) {
//               pins.forEach(function(pin) {
//                 markers.forEach(function(marker) {
//                   if (marker.title == pin.id) {
//                     marker.setIcon(blue_pin);
//                   }
//                 });
//               });
//             });

//             // grab all pins (+ wUser) where type=private && recipient=currentUser
//             $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.username, function(pins) {
            
//               // loop through all pins and add them to map with 'title' as their id
//               for (var i = 0; i < pins.length; i++) {
//                 addMarkerWithTimeout2(pins[i], i * 200)
//               }

//             });
//           }
//         });

//       }, function() {
//         handleNoGeolocation(true);
//       });
//     } else {
//       // Browser doesn't support Geolocation
//       handleNoGeolocation(false);
//     }

//   } // initialize end

//   function addMarkerWithTimeout(pin, timeout) {
//     $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
//       var marker = new google.maps.Marker({
//         position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
//         title: pin.id,
//         map: map,
//         icon: green_pin,
//         type: pin.type
//       });
//       markers.push(marker);
//       google.maps.event.addListener(marker, 'click', function() {
//         onPinClick(marker);
//       });

//       if (pin.status == 'saved') {
//         // do nothing
//       } else if (Math.round(dist.distance) < 250) {
//         marker.setIcon(green_pin_50);
//       } else if (pin.status == 'discovered') {
//         marker.setIcon(gray_pin_50);
//       }
//     });
//   }
// });