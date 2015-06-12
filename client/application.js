$(function() {
  // initializing
  var accessToken = null;
  var currentUser = null;
  var pins = [];

  //hide all main views and loads one on any nav button click
  $( "#navbar button" ).on( "click", function() {
    // hide all visible '.main' views
    $( ".main" ).hide();

    // remove any output from other views
    $( ".show_all" ).remove();
    
    // set 'id' to button.id after removing 'b_' from the start and then show it
    var id = this.id.substring(2, this.id.length);
    $( "#" + id ).show();

    // empty search box on 'find' view
    $( "#search_box" ).val('');
  });

  // generate list
  function iterator(data) {
    pins = [];
    $.getJSON( "/api/wUsers/", function( users ) {

      $.each( data, function( key, val ) {
        user = users.filter(function(user) {
          return user.id == val.wUserId;
        })[0];
        var fullname = user.firstname + ' ' + user.lastname;

        pins.push( 
          "<b><li id='" + key + "'>" + val.id + "</li></b>"
          + "<ul>"
            + "<li>FROM: " + fullname + "</li>"
            + "<li>TO (recipient): " + val.recipient + "</li>"
            + "<li>Message: " + val.message + "</li>"
            + "<li>Coords: " + " (" + val.coords.lat + ", " + val.coords.lng + ")" + "</li>"
            + "<li>Type: " + val.type + "</li>"
            + "<li>Status: " + val.status + "</li>"
          + "</ul>"
        );
      });

      list(pins);
    });
  }

  // display list
  function list(pins) {
    $( "<ul/>", {
      "class": "show_all",
      html: pins.join( "" )
    }).appendTo( "#show" );
  }

  // if .save (success), clear input boxes and flash a 'Success!' message (this covers two views)
  function process(data) {
    // data = JSON.parse(data);
    if (data) {
      // $( "#firstname" ).val('');
      // $( "#lastname" ).val('');
      $( "#message" ).val('');
      // $( "#phone" ).val('');
      // $( "#label" ).val('');
      $( ".saved" ).fadeIn('slow').fadeOut('slow');
    } else {
      alert("STB");
    }
  }

  // lists all pins
  $( "#b_list_all" ).on( "click", function() {
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
  //     $( ".show_all").remove();

  //     $.getJSON( "/api/Pins", query_hash, function( data ) {
  //       iterator(data);
  //     });
  //   }, 500 );
  // });

  // destroy the database entry (no error handling for id not found)
  $( "#b_delete_id" ).on( "click", function() {
    var id = $( "#delete_id" ).val();
    $.ajax({
      url: '/api/Pins/' + id,
      type: 'DELETE',
      success: function(response) {
        $( "#delete_id" ).val('');
        $("#deleted").fadeIn('slow').fadeOut('slow');
      }
    });
  });

  // creates new pin in DB
  $( "#b_save" ).on( "click", function() {
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
  
  // logs in user
  $( "#loginNow" ).on( "click", function() {
    var url = "/api/wUsers/login"
    var loginEmail = $( "#loginEmail" ).val();
    var password = $( "#loginPassword" ).val();
    var loginData = {email: loginEmail, password: password, ttl: 1209600000};
    
    $.post( url, loginData, function (data) {
      accessToken = data.id;
      $('#b_login').hide();
      $('#b_logout').show();
      $.get( "/api/wUsers/" + data.userId, function( userJson ) {
        currentUser = userJson;
        $("#status").text("Logged in as " + currentUser.firstname + " " + currentUser.lastname);
        $("#login").empty().text("Login complete. Enjoy your stay :)");
      });

    });
  });

  // logs out user
  $( "#b_logout" ).on( "click", function() {
    var url = "/api/wUsers/logout?access_token=" + accessToken
    $.post(url, null, function(){
      console.log('logout successful')
      accessToken = null;
      currentUser = null;
      $('#b_login').show();
      $('#b_logout').hide();
      $("#status").text("Not Logged In");
    })
  });

  //user registration
  $( "#register_submit" ).on( "click", function() {
    var url = "/api/wUsers"
    var firstName = $( "#firstname" ).val();
    var lastName = $( "#lastname" ).val();
    var regEmail = $( "#email" ).val();
    var userName = $( "#username" ).val();
    var password = $( "#password" ).val();
    var regData = {email: regEmail, password: password, firstname: firstName, lastname: lastName, username: userName};
    
    $.post( url, regData, function (data) {
      console.log("user: " + userName + " created!");
      $("#register").empty().text("Registration complete. Please login now :)");
    });
  });


});
