const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  googleid: String,
  pfp: String,
  occupation: String,
});

// compile model from schema
module.exports = mongoose.model("user", UserSchema);
