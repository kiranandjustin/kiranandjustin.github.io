var ref = new Firebase("https://sweltering-inferno-5630.firebaseio.com/invite_list");


var nameForm = "\
<div id='lookup_rsvp_in'  class='col-xs-12 form-group controls'> \
    <div id='lookup_names'>Pratik Rathod</div>\
    <input type='checkbox' name='rsvp_wedding' value='rsvp_wedding'>Wedding</input> \
    <input type='checkbox' name='rsvp_reception' value='rsvp_reception'>Reception</input> \
    <select name='rsvp_diet' id='rsvp_diet' class='rsvp_diet'> \
      <option value='none'>Not Applicable</option> \
      <option value='veggie'>Vegetarian</option> \
      <option value='halal'>Halal</option> \
      <option value='nobeef'>No Beef</option> \
      <option value='other'>Other (Please Specify)</option> \
    </select> \
    <input id='rsvp_other_diet' class='rsvp_other_diet' name='rsvp_other_diet' type='text' placeholder='Other Diet' size='8' /> \
</div>\
"

$("#rsvpForm").hide();


function get_postal(snapshot) {
   snapshot.forEach(function(childSnapshot) {
      var postalcode = childSnapshot.postal_code;
      console.log("attempt postal: " + postalcode);
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
    }
    else {
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
        console.log("lookup based on postal: " + familysnap.val());
        $.each( familysnap.val(), function( index, person ) {
          if (person) {
            var formhtml = $.parseHTML(nameForm);
            var name = person.full_name;
            if (person.type === "guest") { name += " (Guest)"; }
            $(formhtml).find('#lookup_names').text(name);
            family[name] = index; // save key to global variable.
            $('#rsvpForm .lookup_info').append($(formhtml));
          }
        });
        setDietaryList();
        $("#contactForm").hide(400);
        $("#rsvpForm").show(400);
      });
    }
  });
};


// Form function
function setDietaryList() {
   //initially hide the textbox
   $(".rsvp_other_diet").hide();
   $('.rsvp_diet').change(function() {
     if($(this).find('option:selected').val() === "other"){ 
       $(this).next().show();
     }else{
       $(this).next().hide();
     }
   });
   
   
   $('#rsvpForm').submit(function() {
     console.log('hello world');
     // send back to firebase (set params)
     var people_form = $('#rsvpForm #lookup_rsvp_in');
     $.each( people_form, function( index, person ) {
       var name = $(person).find('#lookup_names').text();
       var othersOption = $(person).find('#rsvp_diet').find('option:selected');
       if(othersOption.val() == "other")
        {
            // replace select value with text field value
            othersOption.val($("#rsvp_other_diet").val());
        }
        var up_person = new Firebase("https://sweltering-inferno-5630.firebaseio.com/invite_list/" + family[name]);
        if (up_person) {
          debugger;
          up_person.update({
             "rsvp_wedding":$(person).find('input[name=rsvp_wedding]').is(':checked'),
             "rsvp_reception":$(person).find('input[name=rsvp_reception]').is(':checked'),
             "rsvp_diet":othersOption.val(),
             "rsvp_complete":true
           });
        }
        else {
          console.log('new user');
        }
       
     });
   });
};