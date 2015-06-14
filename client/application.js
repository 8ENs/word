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

  // if .save (success), clear input boxes and flash a 'Success!' message (this covers two views)
  function process(data) {
    if (data) {
      // $( "#firstname" ).val('');
      // $( "#lastname" ).val('');
      $( "#message" ).val('');
      // $( "#phone" ).val('');
      // $( "#label" ).val('');
      $( ".dropped" ).fadeIn('slow').fadeOut('slow');
    } else {
      alert("STB");
    }
  }

  // lists all pins
  $( "#nav_explore" ).on( "click", function() {
    $.getJSON( "/api/wUsers/" + currentUser.id + "/pins", function(pins) {
      iterator(pins);
    });
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
        for (var i = 0; i < markers.length; i++) {
          if (markers[i].title == $("#delete_id").val()) {
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

  // create new pin
  $( "#drop" ).on( "click", function() {
    if (currentUser != null) {
      var recipient = $( "#recipient" ).val();
      var message = $( "#message" ).val();
      var type = $( "#type" ).val();
      var status = 'discovered';
      var coords = {lat: pos.A, lng: pos.F};

      var newPin = {recipient: recipient, message: message, coords: coords, type: type, status: status};

      $.post( "/api/wUsers/" + currentUser.id + "/pins", newPin, function (data) {
        debugger
        process(data);
      });

      // seems I need a delay or the marker will flash in final location before doing animation (bug?)
      window.setTimeout(function() {
        $.getJSON( "/api/Pins", function(pins) {
          // grab id of last pin from db (one we just added) - could be a buggy way long-term
          var pin_id = pins[pins.length - 1].id;
          var marker = new google.maps.Marker({
            position: pos,
            title: pin_id,
            map: map,
            icon: pin_icon,
            animation: google.maps.Animation.DROP
          });
          // update marker array
          markers.push(marker);
        });
        
      }, 50);

    } else {
      $( "#message" ).val('ERR - NOT LOGGED IN')
    }
  });
  
  function login(email, pwd) {
    var url = "/api/wUsers/login"
    var loginData = {email: email, password: pwd, ttl: 1209600000};

    $.post( url, loginData, function(auth) {
      accessToken = auth.id;
      $('#nav_login').hide();
      $('#nav_register').hide();
      $('#nav_logout').show();
      $('#nav_drop').show();
      $('#nav_explore').show();
      $('#nav_delete').show();
      $.get( "/api/wUsers/" + auth.userId, function(userJson) {
        currentUser = userJson;
        $("#status").text("Hey " + currentUser.firstname + "!");
        $(".view").hide();
        $("#div_welcome").show();
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
  });

  //user registration
  $( "#register_submit" ).on( "click", function() {
    var url = "/api/wUsers"
    var firstName = $( "#regFirstname" ).val();
    var lastName = $( "#regLastname" ).val();
    var email = $( "#regEmail" ).val();
    var userName = $( "#regUsername" ).val();
    var password = $( "#regPassword" ).val();
    var regData = {email: email, password: password, firstname: firstName, lastname: lastName, username: userName};
    
    $.post( url, regData, function (data) {
      login(email, password);
    });
  });

});
