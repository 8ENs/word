$(function() {
  // See: http://docs.jquery.com/Tutorials:Introducing_$(document).ready()

  // specify the data type as JSON
  // $.get()
  // $.post()
  // $.getJSON()
  // $.ajax()


  // initializing
  var contacts = [];
  var phones = "";
  var accessToken = '';
  var pins = [];


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
    $.each( data, function( key, val ) {
      pins.push( 
        "<b><li id='" + key + "'>" + val.id + "</li></b>"
        + "<ul>"
          + "<li>FROM (wUserId **need to convert**): " + val.wUserId + "</li>"
          + "<li>TO (recipient): " + val.recipient + "</li>"
          + "<li>Message: " + val.message + "</li>"
          + "<li>Coords: " + " (" + val.coords.lat + ", " + val.coords.lng + ")" + "</li>"
          + "<li>Type: " + val.type + "</li>"
          + "<li>Status: " + val.status + "</li>"
        + "</ul>"
      );
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

  $( "#b_list_all" ).on( "click", function() {
    // e.preventDefault();
    $.getJSON( "/api/Pins", function( data ) {
      iterator(data);
     
      // only display results if still on the appropriate view
      if ($("h3:visible")[0].innerText == "List all") {
        list(pins);
      }
    });
  });

  // added delay on keyup to avoid multiple ajax calls stacking up and printing results multiple times
  var delay = (function(){
    var timer = 0;
    return function(callback, ms){
      clearTimeout (timer);
      timer = setTimeout(callback, ms);
    };
  })();

  // find dynamically from search box
  $( "#search_box" ).on( "keyup", function() {
    var self = this;
    delay(function(){
      var search_string = $( self ).val();
      var query_hash = {query: search_string};
      $( ".show_all").remove();

      $.getJSON( "/api/Pins", query_hash, function( data ) {
        iterator(data);

        // only display results if still on the appropriate view
        if ($("h3:visible")[0].innerText == "Find") {
          list(pins);
        }
      });
    }, 500 );
  });

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
    var sender = $( "#sender" ).val();
    var recipient = $( "#recipient" ).val();
    var message = $( "#message" ).val();
    var lat = $( "#lat" ).val();
    var lng = $( "#lng" ).val();
    var type = $( "#type" ).val();
    var status = 'discovered';
    var coords = {lat: lat, lng: lng};

    var url = "/api/Pins"
    var newPin = {wUserId: sender, recipient: recipient, message: message, coords: coords, type: type, status: status};
    $.post( url, newPin, function (data) {
      process(data);
    });
  });
  
    // logs in user
  $( "#loginNow" ).on( "click", function() {
    var url = "/api/wUsers/login"
    var loginEmail = $( "#loginEmail" ).val();
    var password = $( "#password" ).val();

    var loginData = {email: loginEmail, password: password, ttl: 1209600000};
    $.post( url, loginData, function (data) {
      accessToken = data.id;
      $("#loginInfo").text("access token: " + data.id + "    userID: " + data.userId);
    });
  });



});
