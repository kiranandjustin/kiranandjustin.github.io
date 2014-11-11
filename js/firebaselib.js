var ref = new Firebase("https://sweltering-inferno-5630.firebaseio.com/invite_list");


var nameForm = "\
<div id='lookup_rsvp_in'  class='col-xs-12 form-group controls'> \
    <div id='lookup_names'>Pratik Rathod</div> \
    <input type='checkbox' name='rsvp_wedding' value='Car'>Wedding</input> \
    <input type='checkbox' name='rsvp_reception' value='Car'>Reception</input> \
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
function get_family() {
  var first = document.getElementById("firstname").value
  var last = document.getElementById("lastname").value;
  var name = first + " " + last;
  ref.orderByChild("full_name").equalTo(name).limitToLast(1).on("value", function(snapshot) {
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
      
      ref.orderByChild("postal_code").equalTo(postalcode).on("value", function(familysnap) {
        console.log("lookup based on postal: " + familysnap.val());
        $.each( familysnap.val(), function( index, person ) {
          if (person) {
            var formhtml = $.parseHTML(nameForm);
            console.log('person: ' + person);
            var name = person.first_name + " " + person.last_name;
            if (person.type === "guest") {
              name += " (Guest)";
            }
            $(formhtml).find('#lookup_names').text(name);
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
     // send back to firebase (set params)
       var othersOption = $('#rsvp_diet').find('option:selected');
       if(othersOption.val() == "other")
       {
           // replace select value with text field value
           othersOption.val($("#rsvp_other_diet").val());
       }
   });
};