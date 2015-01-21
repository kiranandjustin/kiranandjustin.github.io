var ref = new Firebase("https://sweltering-inferno-5630.firebaseio.com/invite_list");


$(document).ready(function(){
 
  // Initialize Parse with your Parse application & javascript keys
  Parse.initialize("lxPuvmfJt065TVf1BqvRgI76xXsNR6aOE2gOVSYF", "LjG0qSmBzySroDtj1C9xA0vPTdakAotjfCl6uSLs");
 
});


var l = " ";
var family = [];
var nameForm = "\
<div id='lookup_rsvp_in'  class='form-group controls'> \
    <div id='lookup_names'>Pratik Rathod</div>\
    <input id='weddingRSVP' type='checkbox' name='rsvp_wedding' data-animate='false' data-handle-width='25' data-on-text='Yes' data-off-text='No' data-on-color='success' data-off-color='warning' data-size='small' value='rsvp_wedding'>Wedding</input>\
    <input id='receptionRSVP' type='checkbox' name='rsvp_reception' data-animate='false' data-handle-width='25' data-on-text='Yes' data-off-text='No' data-on-color='success' data-off-color='warning' data-size='small' value='rsvp_reception'>Reception</input> \
    <select name='rsvp_diet' id='rsvp_diet' class='rsvp_diet'> \
      <option selected disabled>Dietary Restrictions</option> \
      <option value='none'>None</option> \
      <option value='veggie'>Vegetarian</option> \
      <option value='halal'>Halal</option> \
      <option value='nobeef'>No Beef</option> \
      <option value='other'>Other (Please Specify)</option> \
    </select> \
    <input id='rsvp_other_diet' class='rsvp_other_diet' name='rsvp_other_diet' type='text' placeholder='Other Diet' size='8' /> \
</div>\
";

$("#rsvpForm").hide();


function get_postal(snapshot) {
  snapshot.forEach(function(childSnapshot) {
    var postalcode = childSnapshot.postal_code;
    if (postalcode) {
      return postalcode;  
    }
    
  });
}



// All names are uppercased. Make sure the search 
// text also has the first letter uppercased
function upper_first_letter(name) {
  return name.charAt(0).toUpperCase() + name.substring(1);
}

// Set the status of the person if they have already 
// filled it in previously.
function set_status_if_filled(formhtml, person) {  
  $(formhtml).find('#weddingRSVP').prop('checked', person.rsvp_wedding);
  $(formhtml).find('#receptionRSVP').prop('checked', person.rsvp_reception);  

  // if diet was 'other', set appropriately
  if (['none', 'veggie', 'halal', 'nobeef'].indexOf(person.rsvp_diet) < 0) {
    $(formhtml).find('#rsvp_diet').val('other');
    $(formhtml).find('#rsvp_other_diet').val(person.rsvp_diet);
    $(formhtml).find('#rsvp_other_diet').show();
  }
  // otherwise just set the value of the diet
  else {
    $(formhtml).find('#rsvp_diet').val(person.rsvp_diet);  
    $(formhtml).find('#rsvp_other_diet').hide();
  }
}

// Set default values if person has not filled their 
// information in yet. Defaults all items to 'true'.
function set_default_rsvp_values (formhtml) {
  $(formhtml).find('#weddingRSVP').prop('checked', true);
  $(formhtml).find('#receptionRSVP').prop('checked', true);
  $(formhtml).find('#rsvp_other_diet').hide();
}

// If someone sets the dietary restriction to 'other'
// show the dietary restriction box
function add_change_event_on_diet (formhtml) {
  $(formhtml).find('#rsvp_diet').on('change', function (e) {
    var valueSelected = $(formhtml).find('#rsvp_diet').val();
    if (valueSelected == "other") {
      $(formhtml).find('#rsvp_other_diet').show();
    }
    else {
      $(formhtml).find('#rsvp_other_diet').hide(); 
    }
  });
}

// Get family members based on postal code
// show each person's status in their form
function get_family_from_postal(postalcode) {
  ref.orderByChild("postal_code").equalTo(postalcode).once("value", function(familysnap) {
    $.each( familysnap.val(), function( index, person ) {
      if (person) {
        var formhtml = $.parseHTML(nameForm);
        if (person.type === "Guest") { name += " (Guest)"; }
        $(formhtml).find('#lookup_names').text(person.full_name);
        if (person.rsvp_complete) {
          set_status_if_filled(formhtml, person);
        }
        else {
          set_default_rsvp_values(formhtml);
        }
        add_change_event_on_diet(formhtml);

        // save key to global variable. This is used when submitting the form.
        family[person.full_name] = index; 
        // add name to rsvp list
        $('#rsvpForm .lookup_info').append($(formhtml));
      }
    });
    attach_rsvp_submission_handler();

    // Bootstrap the form with special switches
    // Remove the search form
    // Add the RSVP form
    $("[name='rsvp_wedding']").bootstrapSwitch();
    $("[name='rsvp_reception']").bootstrapSwitch();
    $("#contactForm").hide(400);
    $("#rsvpForm").show(400);
  });
}

// Get's family of names based on a common key. This is often based on 
// postal code. A user must first enter their first and last name. 
// This combination is assumed to be unique.
function get_family() {
  var first = upper_first_letter(document.getElementById("firstname").value);
  var last = upper_first_letter(document.getElementById("lastname").value);
  
  var name = first + " " + last;

  // search for user by using person's full name
  ref.orderByChild("full_name").equalTo(name).limitToLast(1).once("value", function(snapshot) {
    if (snapshot.numChildren() == 0) {
      console.log("user not found");
      $("#rsvpSuccessAlert").hide();
      $("#rsvpUserNotFound").show(400);
    }
    else {
      $("#rsvpUserNotFound").hide();
      var postalcode = 0;
      $.each( snapshot.val(), function( index, value ) {
        if (value) {
          postalcode = value.postal_code;
          return false;
        }
        else {
          console.log("value is undefined");
        }
      });  

      get_family_from_postal(postalcode);
    }
  });
};

// Send backup email to kiranwedsjustin@gmail.com
// This uses Sendgrid via Parse Cloud Computing
// https://sendgrid.com/blog/send-email-static-websites-using-parse/
function send_backup_email(name, upload_person) {
  upload_person.on("value", function(snapshot) {
    var data = {};
    data["to"] = "kiranwedsjustin@gmail.com";
    data["toname"] = "Kiran Weds Justin";
    data["from"] = "kiranwedsjustin@gmail.com";
    data["subject"] = "RSVP: " + name;
    data["text"] = JSON.stringify(snapshot.val(), undefined, 2);

    // Run our Parse Cloud Code and 
    // pass our 'data' object to it
    Parse.Cloud.run("sendEmail", data, {
      success: function(object) {
        console.log("email confirmation sent");
      },
      error: function(object, error) {
        console.log("email failed: " + error);
      }
    });

  }, function (errorObject) {
    console.log("The confirmation email could not be sent: " + errorObject.code);
  });
}

// Form function
function attach_rsvp_submission_handler() { 
  $('#rsvpForm').submit(function() {
    // make sure default behaviour is prevented (page reload)
    event.preventDefault();
    // send back to firebase (set params)
    var people_form = $('#rsvpForm #lookup_rsvp_in');

    // go through each part of the form
    // 'person' holds the form information
    $.each( people_form, function( index, person ) {

      // find name and diet within form
      var name = $(person).find('#lookup_names').text();
      var othersOption = $(person).find('#rsvp_diet').find('option:selected');
      if(othersOption.val() == "other") {
        // replace select value with text field value
        othersOption.val($(person).find('#rsvp_other_diet').val());
      }
    
      // find person to upload new data to
      var up_person = new Firebase("https://sweltering-inferno-5630.firebaseio.com/invite_list/" + family[name]);
      if (up_person) {
        up_person.update({
          "rsvp_wedding":$(person).find('input[name=rsvp_wedding]').is(':checked'),
          "rsvp_reception":$(person).find('input[name=rsvp_reception]').is(':checked'),
          "rsvp_diet":othersOption.val(),
          "rsvp_complete":true
        });
      
        // send a backup email of activity
        send_backup_email(name, up_person);
      }
    });
  $("#rsvpUserNotFound").hide();
  $("#rsvpSuccessAlert").show(400);
  });
};