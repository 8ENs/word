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
    pos = new google.maps.LatLng(49.282123, -123.108421); 

    $stateProvider
      .state('home', {
        url: '/',
        controller: 'MapCtrl',
        templateUrl: 'home.html'
      })
    $urlRouterProvider.otherwise('/');
  })

  .controller('MapCtrl', ['$scope', '$ionicModal', '$ionicActionSheet', '$timeout', '$ionicSideMenuDelegate', 
    function($scope, $ionicModal, $ionicActionSheet, $timeout, $ionicSideMenuDelegate) { // Putting these in strings allows minification not to break

    accessToken = null;
    currentUser = null;
    markers = [];
    currentPin = null;

    //MODAL STUFF

    $ionicModal.fromTemplateUrl('modal1.html', {
      id: '1',
      animation: 'slide-in-up',
      scope: $scope
    }).then(function (modal) {
      $scope.oModal1 = modal;
    });

    $ionicModal.fromTemplateUrl('modal2.html', {
      id: '2',
      animation: 'slide-in-up',
      scope: $scope
    }).then(function (modal) {
      $scope.oModal2 = modal;
    });

    $ionicModal.fromTemplateUrl('modal3.html', {
      id: '3',
      animation: 'slide-in-up',
      scope: $scope
    }).then(function (modal) {
      $scope.oModal3 = modal;
    });

    $ionicModal.fromTemplateUrl('modal4.html', {
      id: '4',
      animation: 'slide-in-up',
      scope: $scope
    }).then(function (modal) {
      $scope.oModal4 = modal;
    });    
    
    $scope.openModal = function (index) {
      if (index == 1) {
        $("#regFirstname").val(''); // Maybe there is a better way to nuke the inputs...
        $("#regLastname").val('');
        $("#regUsername").val('');
        $("#regEmail").val('');   
        $("#regPassword").val('');     
        $scope.oModal1.show()
      } else if (index == 2) {
        $("#loginEmail").val('');
        $("#loginPassword").val('');
        $scope.oModal2.show();        
      } else if (index == 3) {
        $("#recipient").val('');
        $("#message").val('');
        $('#pinType').text('Private');
        $scope.oModal3.show();
      } else {
        $scope.explore();
      }
    }

    $scope.closeModal = function (index) {
      if (index == 1) {
        $scope.oModal1.hide()
      } else if (index == 2) {
        $scope.oModal2.hide();        
      } else if (index == 3) {
        $scope.oModal3.hide();
      } else {
        $scope.oModal4.hide();
      }
    }

    // LOGIN AND REGISTER STUFF

    $scope.displayLoggedInMenus = function() {
      $(function () {
        $("#nav_drop").show();
        $("#nav_explore").show();
        $("#nav_logout").show();
        $("#nav_center_loc").show();
        $("#nav_login").hide();
        $("#nav_register").hide();
      })
    }

    var displayLoggedOutMenus = function() {
      $(function () {
        $("#nav_drop").hide();
        $("#nav_explore").hide();
        $("#nav_logout").hide();
        $("#nav_center_loc").hide();
        $("#nav_login").show();
        $("#nav_register").show();
      })
    }

    var resetMarkers = function() {
      var i = markers.length;
      while (i--) {
        if (markers[i].pin.type != 'public') {
          markers[i].setMap(null);
          markers.splice(i, 1);
        } else {
          markers[i].setIcon(gray_pin_50)
        }
      }
    }

    //check session
    // not upgrading public/saved to full blue, and not paiting immediate inRange pins
    var loadSession = function(){
      console.log('loadSession');
      $scope.loadPublicPins();
      if(sessionStorage.getItem("currentUser")) {
        currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
        accessToken = sessionStorage.getItem("token");
        $scope.loadPrivatePins();
        $scope.paintDiscoveredMarkers();
        $scope.displayLoggedInMenus();
        $("#pin_list").text('Welcome ' + currentUser.firstname + '. Time to get crackin!');
      }
    }

    $scope.login = function (email, password) {
      console.log('login');
      var loginData = {email: email, password: password};
      var authData;

      $.ajax({
        url: API_HOST + "/api/wUsers/login",
        data: loginData,
        type: 'POST',
        success: function(auth) {
          authData = auth;
          accessToken = auth.id;
          sessionStorage.setItem('token', accessToken);
          
          $.get( API_HOST + "/api/wUsers/" + authData.userId, function(userJson) {
            currentUser = userJson;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            $scope.upgradePublicSaved();
            $scope.loadPrivatePins();
            // might need to fully load before painting...if pins near immediate location, they may not turn half-green/blue
            $scope.closeModal(2);
            $scope.displayLoggedInMenus();
            $("#pin_list").text('Welcome ' + currentUser.firstname + '. Time to get crackin!');
          });
        }
      })
      .fail(function() {
        alert('login failed');
      });
    }

    $scope.loginButton = function () {
      var loginEmail = $( "#loginEmail" ).val();
      var loginPassword = $( "#loginPassword" ).val();
      $scope.login(loginEmail, loginPassword);
    }

    $scope.register = function () {
      var url = "/api/wUsers"
      var firstName = $("#regFirstname").val();
      var lastName = $("#regLastname").val();
      var email = $("#regEmail").val();
      var userName = $("#regUsername").val().toLowerCase();
      var password = $("#regPassword").val();
      var regData = {email: email, password: password, firstname: firstName, lastname: lastName, username: userName};
      
      $.post( url, regData, function (data) {
        $scope.login(email, password);
      })
      $scope.closeModal(1);
    }

    $scope.logout = function () {
      console.log('logout');
      $.post(API_HOST + "/api/wUsers/logout?access_token=" + accessToken, null, function() {
      });
      accessToken = null;
      currentUser = null;
      sessionStorage.clear();
      $("#pin_list").text("Welcome. Please login.");
      resetMarkers();
      displayLoggedOutMenus();
    } 

    // DROP PIN

    // Toggle switches
    $scope.pinTypeChange = function() {
      if ($('#pinType').text() == 'Private'){
        type = 'public';
        console.log(type);
        $('#pinType').text('Public')
      } else {
        type = 'private';
        console.log(type);
        $('#pinType').text('Private');
      }
      console.log('Pin Type Changed');
    };

    $scope.pinHiddenChange = function() {
      if ($('#pinVisibility').text() == 'Hidden'){
        console.log(status);
        $('#pinVisibility').text('Discovered');
      } else {
        console.log(status);
        $('#pinVisibility').text('Hidden');
      }
      console.log('Pin Type Changed');
    };   

    $scope.dropPin = function () {
      var recipient = $("#recipient").val();
      var newPin;
      var newPinId;
      $.getJSON(API_HOST + "/api/wUsers?filter[where][username]=" + recipient, function(user) {
        if (currentUser != null && user.length > 0) {
          var message = $("#message").val();
          var coords = {lat: pos.A, lng: pos.F};
          type = $('#pinType').text().toLowerCase();
          status = $('#pinVisibility').text().toLowerCase();
          
          newPin = {recipient: recipient, message: message, coords: coords, type: type, status: status};
        }
      })
      .then(function() {
        $.post( API_HOST + "/api/wUsers/" + currentUser.id + "/pins", newPin, function (pin) {
          newPinId = pin.id;

          $.getJSON(API_HOST + "/api/Pins/" + newPinId, function(pin) {
            var marker = new google.maps.Marker({
              position: pos,
              map: map,
              icon: red_pin,
              animation: google.maps.Animation.DROP
            });
            marker.pin = pin;
            markers.push(marker);
            console.log(marker);
            window.setTimeout(function() {
              if (marker.pin.type == 'public') {
                marker.setIcon(blue_pin_50);
              } else if (marker.pin.recipient == currentUser.username) {
                marker.setIcon(green_pin_50);
              } else {
                marker.setVisible(false);
              }
            }, 2500);

            google.maps.event.addListener(marker, 'click', function() {
              pinClicked = true;
              $scope.onPinClick(marker);
            });
          });
        });
      })
      $scope.closeModal(3);
    }

    // MAP - INITIALIZE

    function initializeMap() {
      console.log('initializeMap');
      var mapOptions = {
        disableDefaultUI: true,
        zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(document.getElementById("map"), mapOptions);

      $scope.map = map;
    }
    google.maps.event.addDomListener(window, 'load', initializeMap);


    // MAP - GEO LOCATION CHECK
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        console.log('geoLoad');

        // Initialize
        var pins = [];
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        pos = new google.maps.LatLng(lat, lng);
        pos = pos;

        // Add a current location to the Map
        $scope.addCurrentGeo();

        // Add all markers to map (default gray_pin_50)
        // $scope.loadPublicPins();

        // Center
        $scope.centerCurrentLocation();

        google.maps.event.addListener(currentLocation, 'dragend', function(event) {
          console.log('dragend');
          pos = new google.maps.LatLng(event.latLng.A, event.latLng.F);
          $scope.pos = pos;

          if (currentUser != null) {
            $scope.iterator([currentPin]);

            // if ($("#pin_list").text('Pin deleted.')) {
            //   $("#pin_list").text('');
            // }

            $scope.paintDiscoveredMarkers();

            $('pin_list').text('Welcome. Please login.');

            // TODO: need to add some sort of refresh where db is queried for new pins not currently in memory

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

    $scope.addCurrentGeo = function() {
      currentLocation = new google.maps.Marker({
        map: map,
        position: pos,
        draggable: true,
        icon: current_loc_icon,
        zIndex: google.maps.Marker.MAX_ZINDEX + 1
      });
    }

    $scope.centerCurrentLocation = function() {
      map.setCenter(pos);
    }

    $scope.loadPublicPins = function() {
      console.log('loadPublicPins');
      // markers = [];
      $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=public", function(pins) {
        pins.forEach(function(pin) {
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
            map: map,
            icon: gray_pin_50,
            visible: false
          });
          marker.pin = pin;
          if (marker.pin.status != 'hidden') {
            marker.setVisible(true);
          }
          markers.push(marker);
          google.maps.event.addListener(marker, 'click', function() {
            pinClicked = true;
            $scope.onPinClick(marker);
          });
        });
        if (currentUser != null)
          $scope.upgradePublicSaved()
      });
    }    

    $scope.upgradePublicSaved = function() {
      console.log('upgradePublicSaved');
      markers.forEach(function(marker) {
        var colour = gray_pin_50;
        if (marker.pin.type == 'public' && marker.pin.status == 'saved') {
          colour = blue_pin;
        }
        marker.setIcon(colour);
      });
    }

    $scope.loadPrivatePins = function() {
      console.log('loadPrivatePins');
      $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.username, function(pins) {
        pins.forEach(function(pin) {
          var colour = gray_pin_50;
          if (pin.status == 'saved') {
            colour = green_pin;
          }
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
            map: map,
            icon: colour,
            visible: false
          });
          marker.pin = pin;
          markers.push(marker);

          if (marker.pin.status != 'hidden') {
            marker.setVisible(true);
          }

          google.maps.event.addListener(marker, 'click', function() {
            pinClicked = true;
            $scope.onPinClick(marker);
          });
        });
        $scope.paintDiscoveredMarkers();
      });
    }   

    isDiscovered = function(marker) {
      return (marker.pin.status == 'discovered' || marker.pin.status == 'hidden');
    }

    $scope.paintDiscoveredMarkers = function () {
      console.log('paintDiscoveredMarkers');
      var discoveredMarkers = markers.filter(isDiscovered);
      if (discoveredMarkers.length > 0) {
        discoveredMarkers.forEach(function(marker) {
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + marker.pin.coords.lat + "&pinLng=" + marker.pin.coords.lng, function(dist) {
            if (Math.round(dist.distance) < 250) {
              // update temp in-range colour
              if (marker.pin.type == 'public') {
                marker.setIcon(blue_pin_50);
              } else if (marker.pin.type == 'private') {
                marker.setIcon(green_pin_50);
              }

              if (marker.pin.status == 'hidden') {
                // if was hidden, now discovered
                setTimeout(function(){alert("WOW! New *hidden* pin(s) discovered!")},100);
                marker.pin.status = 'discovered';
                marker.setVisible(true);
                $.ajax({
                  url: API_HOST + "/api/Pins/" + marker.pin.id,
                  type: 'PUT',
                  data: {"status": "discovered"}
                });
              } else {
                setTimeout(function(){alert('Unread pin(s) in range!')},100);
              }
            } else {
              marker.setIcon(gray_pin_50);
            }
          });
        });
      }
    }

    $scope.onPinClick = function(marker){
      console.log('pinClick');
      if (currentUser != null) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        $.getJSON(API_HOST + "/api/Pins/" + marker.pin.id + "?filter[include]=wUser", function(pin) {
          currentPin = pin;
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {

            var distToPin = Math.round(dist.distance);

            if (distToPin < 250 && pin.status == 'discovered') {
              
              // two different pointers (sloppy)
              marker.pin.status = 'saved';
              pin.status = 'saved';

              if (pin.type == 'public') {
                marker.setIcon(blue_pin);
              } else if (pin.type == 'private') {
                marker.setIcon(green_pin);
              }

              $.ajax({
                url: API_HOST + "/api/Pins/" + pin.id,
                type: 'PUT',
                data: {"status": "saved"}
              });
            } 

            $scope.iterator([pin]);
          });
        });
      }
    }

    $scope.iterator = function(pins) {
      console.log('iterator');
      if (currentPin != null) {
        $.each(pins, function(idx, pin) {
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
            var distToPin = Math.round(dist.distance);
            if (pin.status == 'saved') {
              $("#pin_list").text("MSG: " + pin.message + " | FROM: " + pin.wUser.firstname + " | TYPE: " + pin.type + " | STATUS: " + pin.status + " | DIST: " + Math.round(dist.distance));
              titleText = '"' + pin.message + '" - ' + pin.wUser.firstname;
            } else if (distToPin < 250) {
              $("#pin_list").text("You are close enough! Touch the pin to open.");
              titleText = '"' + pin.message + '" - ' + pin.wUser.firstname + ' (Pin Found!)';
            } else {
              $("#pin_list").text("You need to be " + (distToPin - 250) + " m closer to open this pin!");
              titleText = 'You need to be ' + (distToPin - 250) + ' m closer to open this pin!';
            }
            if (pinClicked) {
              $scope.pinPopUp(pin);
              pinClicked = false;
            }
          });
        });
      }
    }

    $scope.explore = function() {
      console.log('explore');
      var url = API_HOST + "/api/Pins?filter[where][coords][near]=" + pos.A + "," + pos.F + "&filter[include]=wUser&filter[where][or][0][type]=public&filter[where][or][1][status]=discovered&filter[where][or][2][recipient]=" + currentUser.username;
      $.getJSON(url, function(pins) {
        $scope.pins = pins;
        $.each(pins, function(idx, pin) {
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
            var distToPin = Math.round(dist.distance);
            if (pin.type == 'public' && pin.status == 'saved'){
              pic = '/images/public_marker.png';
            } else if (pin.type == 'private' && pin.status == 'saved'){
              pic = '/images/private_marker.png';
            } else if (pin.status == 'discovered'){
              pic = '/images/discovered_marker.png';
              pin.message = 'Discovered Pin!';
            } else if (pin.status == 'hidden'){
              pic = '/images/discovered_marker.png';
              pin.message = 'Hidden message!';
            }
            $.extend(pin, {
              pic: pic,
              dist: distToPin
            });
            $scope.oModal4.show();
          });
        });
      });
    }

    // Triggered on pin click
    $scope.pinPopUp = function(pin) {
      console.log('pinPopUp');
      pinId = pin.id;
      var marker;

      i = markers.length;
      while(i--) {
        if (markers[i].pin.id == pinId) {
          marker = markers[i];
        }
      }
      
      // Show the action sheet
      if (marker.pin.status == 'saved' && pin.type != 'public') {
        var hideSheet = $ionicActionSheet.show({
          titleText: titleText,
          destructiveText: 'Delete',
          cancelText: 'Save',
          cancel: function() {
            marker.setAnimation(null);
          },
          destructiveButtonClicked: function() {
            $scope.deletePin(pinId);
            $("#pin_list").text('Pin deleted.');
            currentPin = null;
            return true;
          }
        });    
      } else {
        var hideSheet = $ionicActionSheet.show({
          titleText: titleText,
          cancelText: 'Cancel',
          cancel: function() {
            marker.setAnimation(null);
          }
        });    
      }
    }; 

    // destroy the database entry (no error handling for id not found)
    $scope.deletePin = function(pinId) {
      $.ajax({
        url: '/api/Pins/' + pinId,
        type: 'DELETE',
        success: function(response) {

          // must be an easier way to search through or filter for specific pin
          for (var i = markers.length - 1; i >= 0; i--) {
            if (markers[i].pin.id == pinId) {
              // remove the marker from map
              markers[i].setMap(null);
              // remove the instance from array
              markers.splice(i, 1);
            }
          }
        }
      });
    }

    $scope.exploreToPinPopUp = function(pin){
      console.log('exploreToPinPopUp');
      $scope.closeModal(4); // Close the Explore Modal

      var currentPinCoords = new google.maps.LatLng(pin.coords.lat, pin.coords.lng);
      map.setCenter(currentPinCoords);

      pinClicked = true;
      markers.forEach(function(marker) {
        if (marker.pin.id == pin.id) {
          $scope.onPinClick(marker); // Show the pin actionSheet
        }
      });
    } 

    function updateCurrentLocation() {
      navigator.geolocation.getCurrentPosition(function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        newLatlng = new google.maps.LatLng(lat,lng);
        currentLocation.setPosition(newLatlng);
        console.log("position updated!");
      });
    }

    // setInterval(updateCurrentLocation, 10000); // updates current location every 10 seconds.
    loadSession();
  }]);

}());