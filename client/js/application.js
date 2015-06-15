$(function() {
  // initializing

  accessToken = null;
  currentUser = null;
  var pins = [];

  $( "#navbar button" ).on( "click", function() {
    // hide all currently visible view
    $(".view").hide();
    
    // navbar redirect (eg. click on #nav_drop points to #div_drop)
    var id = this.id.substring(4, this.id.length);
    $( "#div_" + id ).show();

    if (id == 'login') {
      $("#loginEmail").focus();
    } else if (id == 'drop') {
      $("#recipient").focus();
    } else if (id == 'delete') {
      $("#delete_id").focus();
    } else if (id == 'register') {
      $("#regFirstname").focus();
    }
    
    // empty search box on 'find' view
    // $( "#search_box" ).val('');
  });

  // create new pin
  $( "#drop" ).on( "click", function() {
    var recipient = $("#recipient").val();
    $.getJSON("/api/wUsers?filter[where][username]=" + recipient, function(user) {
      if (currentUser != null && user.length > 0) {
        var message = $("#message").val();
        var type = $("#pinType").val().toLowerCase();
        var status = 'discovered';
        var coords = {lat: pos.A, lng: pos.F};

        var newPin = {recipient: recipient, message: message, coords: coords, type: type, status: status};
        var newPinId = '';

        $.post( "/api/wUsers/" + currentUser.id + "/pins", newPin, function (pin) {
          newPinId = pin.id;

          $.getJSON("/api/Pins/" + newPinId, function(pin) {
            ico = (pin.type == 'public') ? yellow_pin : red_pin;

            markers.push( new google.maps.Marker({
              position: pos,
              title: newPinId,
              map: map,
              icon: ico,
              type: pin.type,
              animation: google.maps.Animation.DROP
            }));
          });
        });

        $(".dropped" ).fadeIn('slow').fadeOut('slow');
        $("#recipient" ).val('');
        $("#message" ).val('');
        $("#pinType" ).val('private');
      } else {
        $("#recipient").val('NEED VALID USERNAME');
      }
    });
    $("#recipient").focus();
  });

  // lists all pins
  $("#nav_explore").on( "click", function() {
    renderPins();
  });

  // added delay on keyup to avoid multiple ajax calls stacking up and printing results multiple times
  // var delay = (function(){
  //   var timer = 0;
  //   return function(callback, ms){
  //     clearTimeout (timer);
  //     timer = setTimeout(callback, ms);
  //   };
  // })();

  // find dynamically from search box
  // $( "#search_box" ).on( "keyup", function() {
  //   var self = this;
  //   delay(function(){
  //     var search_string = $( self ).val();
  //     var query_hash = {query: search_string};
  //     $( ".div_show").remove();

  //     $.getJSON( "/api/Pins", query_hash, function( data ) {
  //       iterator(data);
  //     });
  //   }, 500 );
  // });

  // destroy the database entry (no error handling for id not found)
  $( "#delete" ).on( "click", function() {
    var id = $( "#delete_id" ).val();
    $.ajax({
      url: '/api/Pins/' + id,
      type: 'DELETE',
      success: function(response) {

        // must be an easier way to search through or filter for specific pin
        for (var i = markers.length - 1; i >= 0; i--) {
          if (markers[i].title == id) {
            // remove the marker from map
            markers[i].setMap(null);
            // remove the instance from array
            markers.splice(i, 1);
          }
        }

        $("#delete_id").val('');
        $("#msg_deleted").fadeIn('slow').fadeOut('slow');
      }
    });
  });

  // login
  $( "#login" ).on( "click", function() {
    var loginEmail = $( "#loginEmail" ).val();
    var password = $( "#loginPassword" ).val();
    login(loginEmail, password);
  });

  // logout
  $( "#nav_logout" ).on( "click", function() {
    $.post("/api/wUsers/logout?access_token=" + accessToken, null, function(){
      accessToken = null;
      currentUser = null;
      $('#nav_logout').hide();
      $('#nav_drop').hide();
      $('#nav_explore').hide();
      $('#nav_delete').hide();
      $('#nav_login').show();
      $('#nav_register').show();
      $("#status").text("Welcome. Please login (or register).");
      $(".view").hide();
      $("#div_welcome").show();
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
  });

  //user registration
  $( "#register_submit" ).on( "click", function() {
    var url = "/api/wUsers"
    var firstName = $("#regFirstname").val();
    var lastName = $("#regLastname").val();
    var email = $("#regEmail").val();
    var userName = $("#regUsername").val().toLowerCase();
    var password = $("#regPassword").val();
    var regData = {email: email, password: password, firstname: firstName, lastname: lastName, username: userName};
    
    $.post( url, regData, function (data) {
      login(email, password);
    });
  });
});

function renderPins() {
  // clear old list of pins
  $("#pin_list").empty();

  // get all pins which were dropped TO/FOR the currentUser (including public)
  var here = pos.A + "," + pos.F
  if (currentUser != null) {
    $.getJSON( "/api/Pins?filter[where][coords][near]=" + here + "&filter[include]=wUser&filter[where][or][0][type]=public&filter[where][or][1][recipient]=" + currentUser.username, function(pins) {
      iterator(pins);
    });
  }
}

// generate list
function iterator(pins) {
  $.each( pins, function( idx, pin ) {
    $.getJSON("/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
      var pin_formatted =
        "<b><li id='" + pin.id + "'>" + pin.message + " (" + pin.id + ")</li></b>"
        + "<ul>"
          + "<li>From: " + pin.wUser.firstname + ' ' + pin.wUser.lastname + "</li>"
          + "<li>Type: " + pin.type + "</li>"
          + "<li>Status: " + pin.status + "</li>"
          + "<li>Distance: " + Math.round(dist.distance) + " m</li>"
        + "</ul>"
      ;
      list(pin_formatted);
    });
  });
}

// display list
function list(line) {
  $("<ul/>", {
    "class": "view",
    html: line
  }).appendTo("#pin_list");
}

function addMarkerWithTimeout(pin, timeout) {
  // window.setTimeout(function() {
    $.getJSON("/api/Pins/distance?currentLat=" + pos.A + "&currentLng=" + pos.F + "&pinLat=" + pin.coords.lat + "&pinLng=" + pin.coords.lng, function(dist) {
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
        title: pin.id,
        map: map,
        icon: green_pin,
        type: pin.type
      });

      if (pin.status == 'saved') {
        // do nothing
      } else if (Math.round(dist.distance) < 250) {
        marker.setIcon(green_pin_50);
      } else if (pin.status == 'discovered') {
        marker.setIcon(gray_pin_50);
      }

      markers.push(marker);
    });
  // }, timeout);
}
  
function login(email, pwd) {
  var loginData = {email: email, password: pwd, ttl: 1209600000};

  $.post( "/api/wUsers/login", loginData, function(auth) {
    accessToken = auth.id;
    $('#nav_login').hide();
    $('#nav_register').hide();
    $('#nav_logout').show();
    $('#nav_drop').show();
    $('#nav_explore').show();
    $('#nav_delete').show();
    $.get( "/api/wUsers/" + auth.userId, function(userJson) {
      currentUser = userJson;
      if (currentUser != null) {
        $( "#loginEmail" ).val('');
        $( "#loginPassword" ).val('');
      }
      $(".view").hide();
      $("#status").text("Hey " + currentUser.firstname + "!");
      $("#div_welcome").show();

      // grab all pins (+ wUser) where type=private && recipient=currentUser
      $.getJSON("/api/Pins?filter[include]=wUser&filter[where][type]=private&filter[where][recipient]=" + currentUser.username, function(pins) {
        
        // loop through all pins and add them to map with 'title' as their id
        for (var i = 0; i < pins.length; i++)
          addMarkerWithTimeout(pins[i], i * 200);
      });

    });
  });
  upgradePublicSaved();
}
