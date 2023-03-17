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
  "BQDo5JC8zXdg3_Vco4g8QIJR92QWGj9Bs5znxoyqKN-1cxzJaiO-EZqy4yON467ikvgsnW26uJJmfxOVzxSeq6r1o9N4jqoMWXMIX4OCRR7ybuRfLNmq7FWZNxrsv8yr5q7SQ_4vF9AnJi4T3sJNJwK4wK5u2xm-07DGZBkwfzwkVUilbktXYXeI2_b7vU2hcl2myBY";
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

    const asyncProcess = async () => {
      if ("artist" in req.body) {
        query += req.body.artist + "&type=artist";
        await axios.get(query, config).then((response) => {
          const data = response.data;
          // get the artist ID of first result
          artist = data.artists.items[0].id;
        });
      }
      if ("song" in req.body) {
        query += req.body.song + "&type=track";
        await axios.get(query, config).then((response) => {
          const data = response.data;
          // get the track ID of first result
          song = data.tracks.items[0].id;
        });
      }
    };

    asyncProcess().then(() => {
      // check if custom mood exists for this user, if not create one
      if (user.customMoods.includes(req.body.mood)) {
        Mood.findOneAndUpdate(
          { creator: req.body.id, mood: req.body.mood },
          song ? { $push: { tracks: song } } : { $push: { artists: artist } }
        ).then(res.send({}));
      } else {
        const customMood = new Mood({
          mood: req.body.mood,
          artists: artist ? [artist] : [],
          tracks: song ? [song] : [],
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
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
