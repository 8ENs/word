$(function() {
  // initializing

  var accessToken = null;
  currentUser = null;
  var pins = [];

  $( "#navbar button" ).on( "click", function() {
    // hide all currently visible view
    $( ".view" ).hide();
    
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
        var type = $( "#type" ).val();
        var status = 'discovered';
        var coords = {lat: pos.A, lng: pos.F};

        var newPin = {recipient: recipient, message: message, coords: coords, type: type, status: status};
        var newPinId = '';

        $.post( "/api/wUsers/" + currentUser.id + "/pins", newPin, function (pin) {
          newPinId = pin.id;
        });

        $.getJSON("/api/Pins/" + newPinId, function() {
          var marker = new google.maps.Marker({
            position: pos,
            title: newPinId,
            map: map,
            icon: pin_icon,
            animation: google.maps.Animation.DROP
          });
          // update marker array
          markers.push(marker);
        });

        $(".dropped" ).fadeIn('slow').fadeOut('slow');
        $("#recipient" ).val('');
        $("#message" ).val('');
        $("#type" ).val('private');
      } else {
        $("#recipient").val('NEED VALID USERNAME');
      }
    });
    $("#recipient").focus();
  });

  // lists all pins
  $( "#nav_explore" ).on( "click", function() {
    // NEED TO CHANGE THIS TO DISPLAY ONLY PINS WHERE CURRENTUSER WAS RECIPIENT (NOT CREATOR)
    $.getJSON( "/api/wUsers/" + currentUser.id + "/pins", function(pins) {
      iterator(pins);
    });
  });

  // generate list
  function iterator(pins) {
    pin_array = [];
    $.each( pins, function( idx, pin ) {
      pin_array.push( 
        "<b><li id='" + idx + "'>" + pin.id + "</li></b>"
        + "<ul>"
          + "<li>From: " + currentUser.firstname + ' ' + currentUser.lastname + "</li>"
          + "<li>To: " + pin.recipient + "</li>"
          + "<li>Message: " + pin.message + "</li>"
          + "<li>Type: " + pin.type + "</li>"
          + "<li>Status: " + pin.status + "</li>"
        + "</ul>"
      );
    });
    list(pin_array);
  }

  // display list
  function list(pins) {
    $( "<ul/>", {
      "class": "view",
      html: pins.join( "" )
    }).appendTo( "#pin_list" );
  }

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

  function addMarkerWithTimeout(pin, timeout) {
    window.setTimeout(function() {
      markers.push(new google.maps.Marker({
        position: new google.maps.LatLng(pin.coords.lat, pin.coords.lng),
        title: pin.id,
        map: map,
        icon: pin_icon,
        animation: google.maps.Animation.DROP
      }));
    }, timeout);
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

        $.getJSON("/api/wUsers/" + currentUser.id + "/pins", function(pins) {
          
          // loop through all pins and add them to map with 'title' as their id
          for (var i = 0; i < pins.length; i++)
            addMarkerWithTimeout(pins[i], i * 200);
        });

      });
    });
  }

  // login
  $( "#login" ).on( "click", function() {
    var loginEmail = $( "#loginEmail" ).val();
    var password = $( "#loginPassword" ).val();
    login(loginEmail, password);
  });

  // logout
  $( "#nav_logout" ).on( "click", function() {
    var url = "/api/wUsers/logout?access_token=" + accessToken
    $.post(url, null, function(){
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

    // there is a .setAllMap(null) option but I think it will clear the blue dot too
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];
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
