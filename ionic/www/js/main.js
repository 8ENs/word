(function() {
  var API_HOST = window.API_HOST = 'http://wots.herokuapp.com';

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
  var public_marker = API_HOST + '/images/public_marker.png';
  var private_marker = API_HOST + '/images/private_marker.png';
  var discovered_marker = API_HOST + '/images/discovered_marker.png';
  var in_range = 100;
  var pos;

  angular.module('word', ['ionic', 'ngCordova', 'autocomplete'])
  
  .config(function($stateProvider, $urlRouterProvider) {
    pos = new google.maps.LatLng(49.282123, -123.108421); 

    $stateProvider
      .state('home', {
        url: '',
        controller: 'MapCtrl',
        templateUrl: 'home.html'
      })
    $urlRouterProvider.otherwise('');
  })

  .controller('MapCtrl', ['$scope', '$ionicModal', '$ionicActionSheet', '$timeout', '$ionicSideMenuDelegate', '$cordovaLocalNotification', '$ionicPlatform', '$ionicPopup', 
    function($scope, $ionicModal, $ionicActionSheet, $timeout, $ionicSideMenuDelegate, $cordovaLocalNotification, $ionicPlatform, $ionicPopup) { // Putting these in strings allows minification not to break
    
    // set to true when doing a android build
    var isAndroid = false;

    accessToken = null;
    currentUser = null;
    markers = [];
    currentPin = null;

    $scope.recipientNames = [];
       $.getJSON(API_HOST + "/api/wUsers", function(users){
         users.forEach(function(user){
           $scope.recipientNames.push(user.username);
         })
       });


    $scope.sendNotification = function(message, displayNow) {
      if (typeof displayNow === 'undefined') { optionalArg = false; }
      var now = Date.now();
      console.log(now);
      var lastSent = JSON.parse(sessionStorage.getItem("notificationSentTime"));
      console.log(lastSent)
      var timeElapsed = now - lastSent;
      console.log(timeElapsed)

      if (displayNow) {
        if (isAndroid) {
          $cordovaLocalNotification.schedule({
              id: "1",
              message: message,
              title: "Word on the Street"
          }).then(function () {
              console.log("The time-insensitive android notification has been sent");
          });
        } else {
          $ionicPopup.alert({ title: message });
          console.log("The time-insensitive web notification has been sent");
        }
        
      } else if (timeElapsed > 120000) {
        if (isAndroid) {
          $cordovaLocalNotification.schedule({
              id: "1",
              message: message,
              title: "Word on the Street"
          }).then(function () {
              console.log("The timed android notification has been sent");
              sessionStorage.setItem('notificationSentTime', JSON.stringify(now));
        });
        } else {
          $ionicPopup.alert({ title: message });
          console.log("The timed web notification has been sent");
          sessionStorage.setItem('notificationSentTime', JSON.stringify(now));
        }
      } else {
        console.log('message not sent, stopped based on timing')
      }

    }

  
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
        $("#recipient1").val('');
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

    // Sanitize inputs
    function sanitize(text) {
      return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
          // sanitize swears...? ...shit
    }    

    var loadSession = function(){
      console.log('loadSession');
      $scope.loadPublicPins();
      $scope.loadSponsoredPins();
      if (isAndroid) {
        if(localStorage.getItem("currentUser")) {
          currentUser = JSON.parse(localStorage.getItem("currentUser"));
          accessToken = localStorage.getItem("token");
          $scope.displayLoggedInMenus();
          $("#pin_list").text('Welcome ' + currentUser.firstname + '. Time to get crackin!');
        }
      } else {
        if(sessionStorage.getItem("currentUser")) {
          currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
          accessToken = sessionStorage.getItem("token");
          $scope.displayLoggedInMenus();
          $("#pin_list").text('Welcome ' + currentUser.firstname + '. Time to get crackin!');
        }
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
          if (isAndroid) {
            localStorage.setItem('token', accessToken);
          } else {
            sessionStorage.setItem('token', accessToken);
          }
          $.get( API_HOST + "/api/wUsers/" + authData.userId, function(userJson) {
            currentUser = userJson;
            if (isAndroid) {
              localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
              sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            $scope.upgradePublicSaved();
            $scope.upgradeSponsoredSaved();
            $scope.loadPrivatePins();
            $scope.closeModal(2);
            $scope.displayLoggedInMenus();
            $("#pin_list").text('Welcome ' + currentUser.firstname + '. Time to get crackin!');
          });
        }
      })
      .fail(function() {
        $ionicPopup.alert({ title: "Login Failed" });
      });
    }

    $scope.loginButton = function () {
      var loginEmail = sanitize($( "#loginEmail" ).val().toLowerCase());
      var loginPassword = sanitize($( "#loginPassword" ).val());
      $scope.login(loginEmail, loginPassword);
    }

    $scope.register = function () {
      var url = API_HOST + "/api/wUsers"
      var firstName = sanitize($("#regFirstname").val());
      var lastName = sanitize($("#regLastname").val());
      var email = sanitize($("#regEmail").val().toLowerCase());
      var userName = sanitize($("#regUsername").val().toLowerCase());
      var password = sanitize($("#regPassword").val());
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
      console.log('Pin Type Change');
    };
    
    $scope.pinType = { checked: true };   

    $scope.pinStatusChange = function() {
      console.log('Pin Status Change');
    };
    
    $scope.pinStatus = { checked: true };     

    recipientName = '';
    $scope.grabInput = function(name) {
      recipientName = name;
    }

    $scope.dropPin = function () {
      if ($('#message').val().length == 0) {
        return $ionicPopup.alert({ title: "Please enter a message" });
      }
      if (recipientName == '') {
        recipientName = $("#recipient1").val();
      }
      var recipient = sanitize(recipientName);
      var newPin;
      var newPinId;
      $.getJSON(API_HOST + "/api/wUsers?filter[where][username]=" + recipient, function(user) {
        if (currentUser != null && user.length > 0) {
          var message = sanitize($("#message").val());
          var coords = {lat: pos.A, lng: pos.F};
          if ($scope.pinType.checked){
            type = 'private';
          } else {
            type = 'public';
          }
          if ($scope.pinStatus.checked){
            status = 'hidden';
          } else {
            status = 'discovered';           
          }

          newPin = {recipient: recipient, message: message, coords: coords, type: type, status: status};
          recipientName = '';
        } else {
          return $ionicPopup.alert({ title: "Pin not posted. Recipient username not valid." });
        }
      })
      .then(function() {
        $.post( API_HOST + "/api/wUsers/" + currentUser.id + "/pins", newPin, function (pin) {
          newPinId = pin.id;
          if (pin.type == 'public') {
            dropped_pin = blue_pin_50;
          } else if (pin.type == 'private') {
            dropped_pin = green_pin_50;
          } else {
            dropped_pin = red_pin;
          }
          
          $.getJSON(API_HOST + "/api/Pins/" + newPinId, function(pin) {
            var marker = new google.maps.Marker({
              position: pos,
              map: map,
              icon: dropped_pin,
              animation: google.maps.Animation.DROP
            });
            marker.pin = pin;
            if (pin.status == 'hidden' && pin.recipient != currentUser.username && pin.type == "private"){
              $ionicPopup.alert( {title: "you dropped a hidden pin"});
            } else {
              markers.push(marker);
            }
            
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
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(document.getElementById("map-div"), mapOptions);

      $scope.map = map;
      $scope.$apply();
    }

    
    google.maps.event.addDomListener(window, 'load', function onLoad(){
      initializeMap();
      $ionicPlatform.ready(loadSession);
    });


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

        // Center
        $scope.centerCurrentLocation();

        // Now that we know our current location, add all private markers to map (so that half green/blue toggle appropriately if in_range on load)
        if (currentUser != null) {
          $scope.loadPrivatePins();
        } 
        

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
          $scope.upgradePublicSaved();
      });
    }  

    isPublicSaved = function(marker) {
      return (marker.pin.type == 'public' && marker.pin.status == 'saved');
    }

    $scope.upgradePublicSaved = function() {
      console.log('upgradePublicSaved');
      var publicMarkers = markers.filter(isPublicSaved);
      publicMarkers.forEach(function(marker) {
          marker.setIcon(blue_pin);
      });
    }

    $scope.loadSponsoredPins = function() {
      console.log('loadSponsoredPins');
      // markers = [];
      $.getJSON(API_HOST + "/api/Pins?filter[include]=wUser&filter[where][type]=sponsored", function(pins) {
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
          $scope.upgradeSponsoredSaved();
      });
    }  

    isSponsoredSaved = function(marker) {
      return (marker.pin.type == 'sponsored' && marker.pin.status == 'saved');
    }

    $scope.upgradeSponsoredSaved = function() {
      console.log('upgradeSponsoredSaved');
      var sponsoredMarkers = markers.filter(isSponsoredSaved);
      sponsoredMarkers.forEach(function(marker) {
          marker.setIcon(yellow_pin);
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

    isDiscoveredOrHidden = function(marker) {
      return (marker.pin.status == 'discovered' || marker.pin.status == 'hidden');
    }

    $scope.paintDiscoveredMarkers = function () {
      console.log('paintDiscoveredMarkers');
      var discoveredOrHiddenMarkers = markers.filter(isDiscoveredOrHidden);

      if (discoveredOrHiddenMarkers.length > 0) {
        discoveredOrHiddenMarkers.forEach(function(marker) {
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + marker.pin.coords.lat + "&pinLng=" + marker.pin.coords.lng, function(dist) {
            if (Math.round(dist.distance) < in_range) {
              // update temp in-range colour
              if (marker.pin.type == 'public') {
                marker.setIcon(blue_pin_50);
              } else if (marker.pin.type == 'private') {
                marker.setIcon(green_pin_50);
              } else if (marker.pin.type == 'sponsored') {
                marker.setIcon(yellow_pin_50);
              }

              if (marker.pin.status == 'hidden') {
                // if was hidden, now discovered
                $scope.sendNotification("WOW! New *hidden* pin(s) discovered!", true);
                marker.pin.status = 'discovered';
                marker.setVisible(true);
                $.ajax({
                  url: API_HOST + "/api/Pins/" + marker.pin.id,
                  type: 'PUT',
                  data: {"status": "discovered"}
                });
              } else {
                $scope.sendNotification("Unread Pins Nearby");
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
            if (distToPin < in_range && pin.status == 'discovered') {
              
              // two different pointers (sloppy)
              marker.pin.status = 'saved';
              pin.status = 'saved';

              if (pin.type == 'public') {
                marker.setIcon(blue_pin);
              } else if (pin.type == 'private') {
                marker.setIcon(green_pin);
              } else if (pin.type == 'sponsored') {
                marker.setIcon(yellow_pin);
                pin.recipient = currentUser.username;
                $.ajax({
                  url: API_HOST + "/api/Pins/" + pin.id,
                  type: 'PUT',
                  data: {"recipient": currentUser.username}
                });
              }

              $.ajax({
                url: API_HOST + "/api/Pins/" + pin.id,
                type: 'PUT',
                data: {"status": "saved"}
              });
            } 

          })
          .then(function() {
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
              if (pin.type == 'sponsored') {
                if (pin.recipient == currentUser.username) {
                  $("#pin_list").text('Congrats, ' + currentUser.firstname + ', you won: "' + pin.message + '" - ' + pin.wUser.firstname + ' (' + distToPin + 'm)');
                  titleText = 'Congrats, ' + currentUser.firstname + ', you won: "' + pin.message + '" - ' + pin.wUser.firstname;
                } else {
                  $("#pin_list").text('Snap! This prize has already been claimed by, ' + pin.recipient + '. Keep hunting!');
                  titleText = 'Snap! This prize has already been claimed by, ' + pin.recipient + '. Keep hunting!';
                }
              } else {
                $("#pin_list").text('"' + pin.message + '" - ' + pin.wUser.firstname + ' (' + distToPin + 'm)');
                titleText = '"' + pin.message + '" - ' + pin.wUser.firstname;
              }
            } else if (distToPin < in_range) {
              $("#pin_list").text("You are close enough! Touch the pin to open.");
              titleText = '"' + pin.message + '" - ' + pin.wUser.firstname + ' (Pin Found!)';
            } else {
              $("#pin_list").text("You need to be " + (distToPin - in_range) + "m closer to open this pin!");
              titleText = 'You need to be ' + (distToPin - in_range) + 'm closer to open this pin!';
            }
            if (pinClicked) {
              $scope.pinPopUp(pin);
              pinClicked = false;
            }
          });
        });
      }
    }

    isNotHidden = function(pin) {
      return (pin.status != 'hidden');
    }

    $scope.explore = function() {
      console.log('explore');

      var url = API_HOST + '/api/Pins?filter[where][coords][near]=' + pos.A + ',' + pos.F + '&filter[include]=wUser&filter[where][or][0][type]=public&filter[where][or][1][recipient]=' + currentUser.username;
      $.getJSON(url, function(pins) {
        $scope.pins = pins.filter(isNotHidden);
        $.each(pins, function(idx, pin) {
          $.getJSON(API_HOST + "/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
            var distToPin = Math.round(dist.distance);
            if (pin.type == 'public' && pin.status == 'saved'){
              pic = public_marker;
            } else if (pin.type == 'private' && pin.status == 'saved'){
              pic = private_marker;
            } else if (pin.status == 'discovered'){
              pic = discovered_marker;
              pin.message = '(Discovered Pin!)';
            } else if (pin.status == 'hidden'){
              pic = discovered_marker;
              pin.message = '(Hidden message!)';
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
      if (marker.pin.status == 'saved' && pin.type == 'private') {
        var hideSheet = $ionicActionSheet.show({
          titleText: titleText,
          destructiveText: 'Delete',
          cancelText: 'Dismiss',
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
          cancelText: 'Dismiss',
          cancel: function() {
            marker.setAnimation(null);
          }
        });    
      }
    }; 

    // destroy the database entry (no error handling for id not found)
    $scope.deletePin = function(pinId) {
      $.ajax({
        url: API_HOST + '/api/Pins/' + pinId,
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
        console.log("position auto-updated!");
        pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        $scope.pos = pos;
        currentLocation.setPosition(pos);
      });

        if (currentUser != null) {
          $scope.iterator([currentPin]);

          // don't need this now that we're never dropping red pins
          markers.forEach(function(marker) {
            if (marker.icon.includes('red_pin'))
              marker.setIcon()
          });

          $scope.paintDiscoveredMarkers();
      }
    }

    function queryDatabase() {
      // users can't click on pins unless logged in so should only query db to redraw if logged in
      if (currentUser != null) {
        console.log("db load")
        resetMarkers();
        $scope.loadPrivatePins();
      }
    }

    // Enable Background Mode on Device Ready.
    document.addEventListener('deviceready', function () {
        // Android customization
        cordova.plugins.backgroundMode.setDefaults({ text:'Word on the Street'});
        // Enable background mode
        cordova.plugins.backgroundMode.enable();

    }, false);

    // setInterval(updateCurrentLocation, 10000); // updates current location every 10 seconds.
    // setInterval(queryDatabase, 30000); // queries dB every 10 seconds.
  }]);

}());