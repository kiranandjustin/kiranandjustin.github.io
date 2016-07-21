Parse.Cloud.define("sendEmail", function(request, response) {
  var sendgrid = require("sendgrid");
  sendgrid.initialize("asdf@gmail.com", "asdf");
 
  var name = request.params.name;
  var to = request.params.to;
  var toname = request.params.toname;
  var from = request.params.from;
  var subject = request.params.subject;
  var text = request.params.text;
 
  sendgrid.sendEmail({
   to: to,
   toname: toname,
   from: from,
   subject: subject,
   text: text
   }, {
     success: function(httpResponse) {
       console.log(httpResponse);
       response.success("Email sent!");
    },
     error: function(httpResponse) {
       console.error(httpResponse);
       response.error("Uh oh, something went wrong (Parse + Sendgrid)");
    }
  });
});
