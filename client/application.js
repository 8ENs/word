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
      debugger;
      pins.push( 
        "<b><li id='" + key + "'>" + val.id + "</li></b>"
        + "<ul>"
          + "<li>FROM (wUserId): " + val.wUserId + "</li>"
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
    data = JSON.parse(data);
    if (data.result) {
      $( "#firstname" ).val('');
      $( "#lastname" ).val('');
      $( "#email" ).val('');
      $( "#phone" ).val('');
      $( "#label" ).val('');
      $( "#contact_id" ).val('');
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

      // alternatively could have passed params direclty in url: $.getJSON( "/contacts/find?query=" + search_string, function( data ) {
      $.getJSON( "/contacts/find", query_hash, function( data ) {
        iterator(data);

        // only display results if still on the appropriate view
        if ($("h3:visible")[0].innerText == "Find") {
          list(contacts);
        }
      });
    }, 500 );
  });

  // destroy the database entry (no error handling for id not found)
  $( "#b_delete_id" ).on( "click", function() {
    var id = $( "#delete_id" ).val();
    $.get( "/contact/delete/" + id );
    $( "#delete_id" ).val('');
    $("#deleted").fadeIn('slow').fadeOut('slow');
  });

  // creates new contact in DB
  $( "#b_save" ).on( "click", function() {
    var firstname = $( "#firstname" ).val();
    var lastname = $( "#lastname" ).val();
    var email = $( "#email" ).val();

    // alternatively could have sent url in with params directly: var url = "/contact/new/?firstname=" + firstname + "&lastname=" + lastname + "&email=" + email;
    var url = "/contact/new"
    var newUser = {firstname: firstname, lastname: lastname, email: email};
    $.post( url, newUser, function (data) {
      process(data);
    });
  });

  // adds new phone in DB
  $( "#b_save_phone" ).on( "click", function() {
    var phone = $( "#phone" ).val();
    var label = $( "#label" ).val();
    var contact_id = $( "#contact_id" ).val();
    var newPhone = {phone: phone, label: label, contact_id: contact_id};
    $.post( '/contact/phone/new', newPhone, function (data) {
      process(data);
    });
  });

});
