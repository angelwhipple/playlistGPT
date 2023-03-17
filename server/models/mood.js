const mongoose = require("mongoose");

const MoodSchema = new mongoose.Schema({
  mood: String,
  artists: [String],
  tracks: [String],
  creator: String,
});

// compile model from schema
module.exports = mongoose.model("mood", MoodSchema);
