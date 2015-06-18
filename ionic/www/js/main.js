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

  angular.module('word', ['ionic','word.services'])
  .config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
      .state('home', {
        url: '/',
        controller: 'MapCtrl',
        templateUrl: 'home.html'
      })

    $urlRouterProvider.otherwise('/');
  })


  .controller('MapCtrl', ['$scope', '$ionicModal', 'Pins', '$ionicActionSheet', '$timeout', 
    function($scope, $ionicModal, Pins, $ionicActionSheet, $timeout) { // Putting these in strings allows minification not to break
    accessToken = null;
    currentUser = null;
    markers = [];
    currentPin = null;
    pos = new google.maps.LatLng(49.282123, -123.108421); 

    // services.js
    $scope.pins = Pins.all();


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
        $scope.oModal1.show()
      } else if (index == 2) {
        $scope.oModal2.show();        
      } else if (index == 3) {
        $scope.oModal3.show();
      } else {
        $scope.oModal4.show();
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

    var displayPrivatePins = function() {
      $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.username, function(pins) {
        $("#pin_list").text('Welcome ' + currentUser.firstname + '. Time to get crackin!');
        for (var i = 0; i < pins.length; i++)
          $scope.addMarkerWithTimeout(pins[i], i * 200)
      });
    }

    var displayLoggedInMenus = function() {
      $scope.upgradePublicSaved();
      $(function () {
        $("#nav_drop").show();
        $("#nav_explore").show();
        $("#nav_logout").show();
        $("#nav_login").hide();
        $("#nav_register").hide();
      })

    }


    //check session
    var loadSession = function(){
      if(sessionStorage.getItem("currentUser")) {
        currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
        accessToken = sessionStorage.getItem("token");
        displayPrivatePins();
        displayLoggedInMenus();
      }
    }


    $scope.login = function (email, password) {
      var loginData = {email: email, password: password};
      
      $.post( API_HOST + "/api/wUsers/login", loginData, function(auth) {
        accessToken = auth.id;
        sessionStorage.setItem('token', accessToken);
        $.get( API_HOST + "/api/wUsers/" + auth.userId, function(userJson) {
          currentUser = userJson;
          sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
          displayPrivatePins();
        });
      });
      $scope.closeModal(2);
      displayLoggedInMenus();
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
              animation: google.maps.Animation.DROP,
              pinId: pin.id
            });
            markers.push(marker);
            google.maps.event.addListener(marker, 'click', function() {
              onPinClick(marker);
            });
          });
        });
      })
      $scope.closeModal(3);
    } //end drop
    

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
            
            // $scope.iterator([pin]);
            $scope.show([pin]);
          });
        });
      }
    }

    $scope.renderPin = function (pin) {
      // clear old list
      // $(".view").hide();
      // $("#pin_list").empty();

      if (currentUser != null) {
        $scope.iterator([pin]);
      }
    }

    $scope.renderPins = function () {
      // clear old list of pins
      // $("#pin_list").empty();

      // get all pins which were dropped TO/FOR the currentUser (including public)
      
      var here = pos.A + "," + pos.F
      if (currentUser != null) {
        $.getJSON( "/api/Pins?filter[where][coords][near]=" + here + "&filter[include]=wUser&filter[where][or][0][type]=public&filter[where][or][1][recipient]=" + currentUser.username, function(pins) {
          $scope.list(pins);
        });
      }
    }

    // OLD version to show in subFooter, new actionSheet with $scope.show() below
    $scope.iterator = function(pins) {
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

    // Triggered on pin click
    $scope.show = function(pins) {
       $.each(pins, function(idx, pin) {
        $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
          var distToPin = Math.round(dist.distance);
          var titleText = ''; 
            // $("#pin_list").empty();
            // This section immediately below should stay for demo purposes to show a constant update in subFooter
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
          titleText += "12:45pm";

           // Show the action sheet
           var hideSheet = $ionicActionSheet.show({
              titleText: titleText,
              destructiveText: 'Delete',
              cancelText: 'Cancel',
              cancel: function() {
                  // add cancel code..
                },
              buttonClicked: function(index) {
               return true;
              }
           });

           // hide the sheet after two seconds (this doesn't work)
           $timeout(function() {
             //hideSheet.hide();
           }, 2000);
        });
      });     
    };   

    $scope.goToPinPopUp = function(pin){
      $scope.closeModal(4); // Close the Explore Modal
      $scope.show([pin]); // Show the pin actionSheet
    } 

    // display list
    $scope.list = function (line) {
      $("#pin_list").append(line);
    }

    loadSession();
  }]);

}());