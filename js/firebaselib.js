var ref = new Firebase("https://sweltering-inferno-5630.firebaseio.com/invite_list");

function get_family() {
  var first = document.getElementById("firstname").value;
  var last = document.getElementById("firstname").value;
  ref.orderByChild("first_name").equalTo(first).on("value", function(snapshot) {
    console.log(snapshot.numChildren());
    console.log(snapshot.key());
    console.log(snapshot.val());
  });
};