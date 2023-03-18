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
const { Model } = require("mongoose");
const accessToken =
  "BQC_LhOA5uYtnetFyf4hF1Lms8Fk3nQPnldZe0R-9IiGB7rLrO3YV4FQOM2n2PETNDAxbYOSi1HfLD7pr6CYUTvVwoeUneTO3w_GinWD5b02iASEoXbCRmm0H8kg4CgSGaRpTSZmibPwcw_wstessWHa61PdC_DesOBv2vgtOGt9OxGpV9B_jOqF9-Bl3kNOYouvaqs";
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

    // search song/artist
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

    // update song/artist to user data
    const asyncProcess2 = async () => {
      // check if custom mood exists for this user, if not create one
      if (user.customMoods.includes(req.body.mood)) {
        await Mood.findOneAndUpdate(
          { creator: req.body.id, mood: req.body.mood },
          song ? { $push: { tracks: song } } : { $push: { artists: artist } }
        );
      } else {
        const customMood = new Mood({
          mood: req.body.mood,
          artists: artist ? [artist] : [],
          tracks: song ? [song] : [],
          creator: req.body.id,
        });
        // save custom mood NAME to user's list of custom moods
        await customMood.save().then(async (mood) => {
          await User.findByIdAndUpdate(req.body.id, { $push: { customMoods: mood.mood } });
        });
      }
    };

    // update song/artist to training data
    const asyncProcess3 = async () => {
      await Mood.findOne({ mood: req.body.mood, creator: "training data" }).then(
        async (training) => {
          if (training) {
            await Mood.findOneAndUpdate(
              { mood: req.body.mood, creator: "training data" },
              song ? { $push: { tracks: song } } : { $push: { artists: artist } }
            ).then(res.send({}));
          } else {
            const trainingDataMood = new Mood({
              mood: req.body.mood,
              artists: artist ? [artist] : [],
              tracks: song ? [song] : [],
              creator: "training data",
            });
            await trainingDataMood.save().then(res.send({}));
          }
        }
      );
    };

    asyncProcess().then(() => {
      asyncProcess2().then(() => {
        asyncProcess3();
      });
    });
  });
});

router.get("/customsongs", async (req, res) => {
  const query = "https://api.spotify.com/v1/tracks/";
  const customSongs = { songs: [] };

  const asyncProcess = async () => {
    await Mood.findOne({ creator: req.query.id, mood: req.query.mood }).then(async (customMood) => {
      if (customMood) {
        for (const songId of customMood.tracks) {
          let finalQuery = query + songId;
          await axios.get(finalQuery, config).then((response) => {
            data = response.data;
            customSongs.songs.push(data);
          });
        }
      }
    });
  };
  await asyncProcess();
  res.send(customSongs);
});

router.post("/deletesong", (req, res) => {
  Mood.findOneAndUpdate(
    { creator: req.body.id, mood: req.body.mood },
    { $pull: { tracks: req.body.songId } }
  ).then(res.send({}));
});

router.get("/customartists", async (req, res) => {
  const query = "https://api.spotify.com/v1/artists/";
  const customArtists = { artists: [] };

  const asyncProcess = async () => {
    await Mood.findOne({ creator: req.query.id, mood: req.query.mood }).then(async (customMood) => {
      if (customMood) {
        for (const artistId of customMood.artists) {
          let finalQuery = query + artistId;
          await axios.get(finalQuery, config).then((response) => {
            data = response.data;
            customArtists.artists.push(data);
          });
        }
      }
    });
  };
  await asyncProcess();
  res.send(customArtists);
});

router.post("/deleteartist", (req, res) => {
  Mood.findOneAndUpdate(
    { creator: req.body.id, mood: req.body.mood },
    { $pull: { artists: req.body.artistId } }
  ).then(res.send({}));
});

// PLAYLIST GENERATOR

const MAX_SEED = 5;

router.get("/customizedplaylist", (req, res) => {
  const query = "https://api.spotify.com/v1/recommendations?q=";
  Mood.findOne({ creator: req.query.id, mood: req.query.mood }).then((userMood) => {
    let finalQuery = query;
    if (userMood) {
      let seedsRemaining = MAX_SEED;
      let seedArtists = "&seed_artists=";
      for (let i = 0; i < Math.max(2, userMood.artists.length); ++i) {
        let rand = Math.floor(Math.random() * userMood.artists.length);
        let artistId = userMood.artists[rand];
        seedArtists += artistId + ",";
        seedsRemaining--;
      }
      finalQuery += seedArtists;
      let seedTracks = "&seed_tracks=";
      for (let i = 0; i < Math.max(seedsRemaining, userMood.tracks.length); ++i) {
        let rand = Math.floor(Math.random() * userMood.tracks.length);
        let songId = userMood.tracks[rand];
        seedTracks += songId + ",";
      }
      finalQuery += seedTracks;
      axios.get(finalQuery, config).then((response) => {
        res.send(response.data);
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
