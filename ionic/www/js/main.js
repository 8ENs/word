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
        controller: 'MapCtrl',
        templateUrl: 'home.html'
      })
    $urlRouterProvider.otherwise('/');
  })

  .controller('MapCtrl', function($scope, $ionicModal) {
    accessToken = null;
    currentUser = null;
    markers = [];
    currentPin = null;
    pos = new google.maps.LatLng(49.282123, -123.108421); 

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
    
    $scope.openModal = function (index) {
      if (index == 1) {
        $scope.oModal1.show()
      } else if (index == 2) {
        $scope.oModal2.show();
      } else {
        $scope.oModal3.show();
      }
    }

    $scope.closeModal = function (index) {
      if (index == 1) {
        $scope.oModal1.hide()
      } else if (index == 2) {
        $scope.oModal2.hide();
      } else {
        $scope.oModal3.hide();
      }
    }

    // LOGIN AND REGISTER STUFF

    $scope.displayLoggedInMenus = function() {
      $(function () {
        $("#nav_drop").show();
        $("#nav_explore").show();
        $("#nav_logout").show();
        $("#nav_login").hide();
        $("#nav_register").hide();
      })
    }

    var displayLoggedOutMenus = function() {
      $(function () {
        $("#nav_drop").hide();
        $("#nav_explore").hide();
        $("#nav_logout").hide();
        $("#nav_login").show();
        $("#nav_register").show();
      })
    }

    var resetMarkers = function() {
      var i = markers.length;
      while (i--) {
        if (markers[i].type != 'public') {
          markers[i].setMap(null);
          markers.splice(i, 1);
        } else {
          markers[i].setIcon(gray_pin_50)
        }
      }
    }

    //check session
    var loadSession = function(){
      if(sessionStorage.getItem("currentUser")) {
        currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
        accessToken = sessionStorage.getItem("token");
        $scope.loadPrivatePins();
        $scope.displayLoggedInMenus();
      }
    }

    $scope.login = function (email, password) {
      var loginData = {email: email, password: password};
      var authData;

      $.post( API_HOST + "/api/wUsers/login", loginData, function(auth) {
        authData = auth;
        accessToken = auth.id;
        sessionStorage.setItem('token', accessToken);
      })
      .then(function() {
        $.get( API_HOST + "/api/wUsers/" + authData.userId, function(userJson) {
          currentUser = userJson;
          sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
          $scope.upgradePublicSaved();
          $scope.loadPrivatePins();
          $scope.paintDiscoveredMarkers();
          $("#pin_list").text('Welcome ' + currentUser.firstname + '. Time to get crackin!');
        });
      });
      $scope.closeModal(2);
      $scope.displayLoggedInMenus();
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
      $.post(API_HOST + "/api/wUsers/logout?access_token=" + accessToken, null, function(){
        accessToken = null;
        currentUser = null;
        sessionStorage.clear();
      })

      $("#pin_list").text("Welcome. Please login.");
      resetMarkers();
      displayLoggedOutMenus();
      $scope.loadPublicPins();
    } 

    // DROP PIN

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
      })
      $scope.closeModal(3);
    }

    // MAP - INITIALIZE

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


    // MAP - GEO LOCATION CHECK
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {

        // Initialize
        var pins = [];
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        pos = new google.maps.LatLng(lat, lng);

        // Add a current location to the Map
        $scope.addCurrentGeo();

        // Add all markers to map (default gray_pin_50 & invisible)
        $scope.loadPublicPins();

        // Center
        map.setCenter(pos);

        google.maps.event.addListener(currentLocation, 'dragend', function(event) {
          pos = new google.maps.LatLng(event.latLng.A, event.latLng.F);

          if (currentUser != null) {
            $scope.iterator([currentPin]);
            $scope.paintDiscoveredMarkers();

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

    $scope.loadPublicPins = function() {
      // markers = [];
      $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=public", function(pins) {
        pins.forEach(function(pin) {
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
            map: map,
            icon: gray_pin_50
          });
          marker.pin = pin;
          markers.push(marker);
          google.maps.event.addListener(marker, 'click', function() {
            $scope.onPinClick(marker);
          });
        });
      });
    }    

    $scope.upgradePublicSaved = function() {
      markers.forEach(function(marker) {
        var colour = gray_pin_50;
        if (marker.pin.type == 'public' && marker.pin.status == 'saved') {
          colour = blue_pin;
        }
        marker.setIcon(colour);
      });
    }

    $scope.loadPrivatePins = function() {
      $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.username, function(pins) {
        pins.forEach(function(pin) {
          var colour = gray_pin_50;
          if (pin.status == 'saved') {
            colour = green_pin;
          }
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
            map: map,
            icon: colour
          });
          marker.pin = pin;
          markers.push(marker);
          google.maps.event.addListener(marker, 'click', function() {
            $scope.onPinClick(marker);
          });
        });
      });
    }   

    isDiscovered = function(marker) {
      return marker.pin.status == 'discovered';
    }

    $scope.paintDiscoveredMarkers = function () {
      var discoveredMarkers = markers.filter(isDiscovered);
      if (discoveredMarkers.length > 0) {
        discoveredMarkers.forEach(function(marker) {
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + marker.pin.coords.lat + "&pinLng=" + marker.pin.coords.lng, function(dist) {
            if (Math.round(dist.distance) < 250) {
              if (marker.pin.type == 'public') {
                marker.setIcon(blue_pin_50);
              } else if (marker.pin.type == 'private') {
                marker.setIcon(green_pin_50);
              }
            } else {
              marker.setIcon(gray_pin_50);
            }
          });
        });
      }
    }

    $scope.onPinClick = function(marker){
      if (currentUser != null) {
        $.getJSON(API_HOST + "/api/Pins/" + marker.pin.id + "?filter[include]=wUser", function(pin) {
          currentPin = pin;
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {

            var distToPin = Math.round(dist.distance);

            if (distToPin < 250 && pin.status == 'discovered') {
              pin.status = 'saved';

              $.ajax({
                url: API_HOST + "/api/Pins/" + pin.id,
                type: 'PUT',
                data: {"status": "saved"}
              });
              $scope.paintDiscoveredMarkers();
            } 
            
            $scope.iterator([pin]);
          });
        });
      }
    }

    $scope.iterator = function(pins) {
      if (currentPin != null) {
        $.each(pins, function(idx, pin) {
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
            var distToPin = Math.round(dist.distance);
              // $("#pin_list").empty();
            if (pin.status == 'saved') {
              $("#pin_list").text("MSG: " + pin.message + " | FROM: " + pin.wUser.firstname + " | TYPE: " + pin.type + " | STATUS: " + pin.status + " | DIST: " + Math.round(dist.distance));
            } else if (distToPin < 250) {
              $("#pin_list").text("You are close enough! Touch the pin to open.");
            } else {
              $("#pin_list").text("You need to be " + (distToPin - 250) + " m closer to open this pin!");
            }
          });
        });
      }
    }

    // loadSession();
  });

}());