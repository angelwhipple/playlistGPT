const mongoose = require("mongoose");

const PlaylistSchema = new mongoose.Schema({
  mood: String,
  tracks: [String],
  creator: String,
});

// compile model from schema
module.exports = mongoose.model("playlist", PlaylistSchema);
