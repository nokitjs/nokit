const app = require("./");
app.server.start(function(err, info) {
  if (err) {
    return console.error(err);
  }
  console.log(info);
});