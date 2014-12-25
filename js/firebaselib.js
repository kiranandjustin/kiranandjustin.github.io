var ref = new Firebase("https://sweltering-inferno-5630.firebaseio.com/invite_list");


var l = " ";
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

var family = [];
function get_family() {
  var first = document.getElementById("firstname").value
  first = first.charAt(0).toUpperCase() + first.substring(1);
  var last = document.getElementById("lastname").value;
  last = last.charAt(0).toUpperCase() + last.substring(1);
  var name = first + " " + last;
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
      
      ref.orderByChild("postal_code").equalTo(postalcode).once("value", function(familysnap) {
        $.each( familysnap.val(), function( index, person ) {
          if (person) {
            var formhtml = $.parseHTML(nameForm);
            var name = person.full_name;
            var weddingRSVP = person.rsvp_wedding;
            var receptionRSVP = person.rsvp_reception;
            var diet = person.rsvp_diet;
            if (person.type === "Guest") { name += " (Guest)"; }
            $(formhtml).find('#lookup_names').text(name);
            $(formhtml).find('#weddingRSVP').prop('checked', weddingRSVP);
            $(formhtml).find('#receptionRSVP').prop('checked', receptionRSVP);
            if (['none', 'veggie', 'halal', 'nobeef'].indexOf(diet) < 0) {
              $(formhtml).find('#rsvp_diet').val('other');
              $(formhtml).find('#rsvp_other_diet').val(person.rsvp_diet);
              $(formhtml).find('#rsvp_other_diet').show();
            }
            else {
              $(formhtml).find('#rsvp_diet').val(diet);  
              $(formhtml).find('#rsvp_other_diet').hide();
            }
            family[name] = index; // save key to global variable.
            $('#rsvpForm .lookup_info').append($(formhtml));
          }
        });
        setDietaryList();
        $("[name='rsvp_wedding']").bootstrapSwitch();
        $("[name='rsvp_reception']").bootstrapSwitch();
        $("#contactForm").hide(400);
        $("#rsvpForm").show(400);
      });
    }
  });
};

$(document).ready(function(){
    $(".close").click(function(){
        $(".alert").alert();
    });
});


// Form function
function setDietaryList() {
   
   $('#rsvpForm').submit(function() {
     event.preventDefault();
     // send back to firebase (set params)
     var people_form = $('#rsvpForm #lookup_rsvp_in');
     $.each( people_form, function( index, person ) {
       var name = $(person).find('#lookup_names').text();
       var othersOption = $(person).find('#rsvp_diet').find('option:selected');
       if(othersOption.val() == "other")
        {
            // replace select value with text field value
            othersOption.val($(person).find('#rsvp_other_diet').val());
        }
        var up_person = new Firebase("https://sweltering-inferno-5630.firebaseio.com/invite_list/" + family[name]);
        if (up_person) {
          up_person.update({
             "rsvp_wedding":$(person).find('input[name=rsvp_wedding]').is(':checked'),
             "rsvp_reception":$(person).find('input[name=rsvp_reception]').is(':checked'),
             "rsvp_diet":othersOption.val(),
             "rsvp_complete":true
           });

          // send confirmation email to kiranwedsjustin@gmail.com
          var url = "https://api.sendgrid.com/api/mail.send.json"
          
          up_person.on("value", function(snapshot) {
            console.log(snapshot.val());
            var data = {};
            data["to"] = "kiranwedsjustin@gmail.com";
            data["toname"] = "Kiran Weds Justin";
            data["from"] = "kiranwedsjustin@gmail.com";
            data["subject"] = "RSVP: " + name;
            data["text"] = snapshot.val();
            data["api_user"] = "kiranwedsjustin@gmail.com";
            data["api_key"] = "kiranwedsjustin"

            var posting = $.post(url, data);
 
            // Put the results in a div
            posting.done(function( data ) {
              console.log("confirmation sent: " + data);
            });
          }, function (errorObject) {
            console.log("The confirmation email could not be sent: " + errorObject.code);
          });
        }
     });
     $("#rsvpUserNotFound").hide();
     $("#rsvpSuccessAlert").show(400);
    
   });
};