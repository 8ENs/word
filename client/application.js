$(function() {
  // initializing
  var accessToken = null;
  var currentUser = null;
  var pins = [];

  $( "#navbar button" ).on( "click", function() {
    // hide all currently visible view
    $( ".view" ).hide();
    
    // navbar redirect (eg. click on #nav_drop points to #div_drop)
    var id = this.id.substring(4, this.id.length);
    $( "#div_" + id ).show();

    // empty search box on 'find' view
    $( "#search_box" ).val('');
  });

  // generate list
  function iterator(data) {
    pins = [];
    $.getJSON( "/api/wUsers/", function(users) {
      $.each( data, function( idx, pin ) {

        sender = users.filter(function(user) {
          return user.id == pin.wUserId;
        })[0];

        pins.push( 
          "<b><li id='" + idx + "'>" + pin.id + "</li></b>"
          + "<ul>"
            + "<li>FROM: " + sender.firstname + ' ' + sender.lastname + "</li>"
            + "<li>TO (recipient): " + pin.recipient + "</li>"
            + "<li>Message: " + pin.message + "</li>"
            + "<li>Coords: " + " (" + pin.coords.lat + ", " + pin.coords.lng + ")" + "</li>"
            + "<li>Type: " + pin.type + "</li>"
            + "<li>Status: " + pin.status + "</li>"
          + "</ul>"
        );
      });

      list(pins);
    });
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
    $.getJSON( "/api/Pins", function( data ) {
      iterator(data);
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
        $("#delete_id").val('');
        $("#msg_deleted").fadeIn('slow').fadeOut('slow');
      }
    });
  });

  // creates new pin in DB
  $( "#drop" ).on( "click", function() {
    if (currentUser != null) {
      var recipient = $( "#recipient" ).val();
      var message = $( "#message" ).val();
      var type = $( "#type" ).val();
      var status = 'discovered';
      var coords = {lat: $("#lat").val(), lng: $("#lng").val()};

      var url = "/api/Pins"
      var newPin = {wUserId: currentUser.id, recipient: recipient, message: message, coords: coords, type: type, status: status};

      $.post( url, newPin, function (data) {
        process(data);
      });
    } else {
      $( "#message" ).val('ERR - NOT LOGGED IN')
    }
  });
  
  // login
  $( "#login" ).on( "click", function() {
    var url = "/api/wUsers/login"
    var loginEmail = $( "#loginEmail" ).val();
    var password = $( "#loginPassword" ).val();
    var loginData = {email: loginEmail, password: password, ttl: 1209600000};

    $.post( url, loginData, function(auth) {
      accessToken = auth.id;
      $('#nav_login').hide();
      $('#nav_logout').show();
      $.get( "/api/wUsers/" + auth.userId, function(userJson) {
        currentUser = userJson;
        $("#status").text("Hey " + currentUser.firstname + "!");
        $(".view").hide();
        $("#div_welcome").show();
      });
    });

  });

  // logout
  $( "#nav_logout" ).on( "click", function() {
    var url = "/api/wUsers/logout?access_token=" + accessToken
    $.post(url, null, function(){
      accessToken = null;
      currentUser = null;
      $('#nav_logout').hide();
      $('#nav_login').show();
      $("#status").text("Welcome. Please login.");
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
      console.log("user: " + userName + " created!");
      $("#status").text('account created! Please login now.');
      $(".view").hide();
      $("#div_welcome").show();
    });
  });


});
