/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");
const Mood = require("./models/mood");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");
const { ProgressPlugin } = require("webpack");
const { response } = require("express");

// spotify API
const { default: axios } = require("axios");
const { redirect } = require("react-router-dom");
const accessToken =
  "BQBwyCTYcbzs0GJBHXR73j9eh5hKVWb6CV83NklkuKrB29YGfrM3pYLpGVtkb6C3zef4qLJAKilXmHkkunlzf3hh4jhtv4_Ln7q_SnKDdPkOpugND1IFij1f0tDvSTMIoLMccVdkAfHiXT-vo26nV0UpZhcTJ6H-2RUgd95Smc3ge-KUrSX_GHCU6zdUJazeYhx0mSw";
const config = {
  headers: {
    Authorization: "Bearer " + accessToken,
  },
};

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user)
    // socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
    res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

router.post("/setpfp", (req, res) => {
  User.findByIdAndUpdate(req.body.id, { $set: { pfp: req.body.pfp } }).then((user) => {
    socketManager.getIo().emit("newpfp", user);
    res.send({});
  });
});

router.post("/updatemood", (req, res) => {
  User.findById(req.body.id).then((user) => {
    let query = "https://api.spotify.com/v1/search?q=";
    let [song, artist] = ["", ""];
    if ("artist" in req.body) {
      query += req.body.artist + "&type=artist";
      axios.get(query, config).then((response) => {
        const data = response.data;
        // get the artist ID of first result
        artist = data.artists.items[0];
        // console.log(artist.id);
      });
    }
    if ("song" in req.body) {
      query += req.body.song + "&type=track";
      axios.get(query, config).then((response) => {
        const data = response.data;
        // get the track ID of first result
        song = data.tracks.items[0];
        // console.log(song.id);
      });
    }
    // check if custom mood exists for this user, if not create one
    if (user.customMoods.includes(req.body.mood)) {
      Mood.findOneAndUpdate(
        { creator: req.body.id, mood: req.body.mood },
        song ? { $push: { songs: song } } : { $push: { artists: artist } }
      ).then(res.send({}));
    } else {
      const customMood = new Mood({
        mood: req.body.mood,
        artists: artist !== "" ? [artist.id] : [],
        songs: song !== "" ? [song.id] : [],
        creator: req.body.id,
      });
      // save custom mood NAME to user's list of custom moods
      customMood.save().then((mood) => {
        User.findByIdAndUpdate(req.body.id, { $push: { customMoods: mood.mood } }).then(
          res.send({})
        );
      });
    }
  });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
