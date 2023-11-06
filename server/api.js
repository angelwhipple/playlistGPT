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
const request = require("request");

// spotify API
const SPOTIFY_CLIENT_ID = "d4641c30fa824100b34dde4383a276a1";
const SPOTIFY_CLIENT_SECRET = "d0f65308c953430d9c1bd0095d9769fb";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token?grant_type=client_credentials";
const { default: axios } = require("axios");
const { redirect } = require("react-router-dom");
const { Model } = require("mongoose");

// SPOTIFY
const config = {
  headers: {
    Authorization: `Bearer `,
  },
};
const authOptions = {
  url: "https://accounts.spotify.com/api/token",
  headers: {
    Authorization:
      "Basic " +
      new Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
  },
  form: {
    grant_type: "client_credentials",
  },
  json: true,
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

router.get("/spotify", async (req, res) => {
  console.log("[BACKEND] Requesting Spotify access token");
  request.post(authOptions, async (error, response, body) => {
    console.log(`[BACKEND] Response body: ${JSON.stringify(body)}`);
    res.send({ accessToken: body.access_token });
  });
});

router.post("/setpfp", (req, res) => {
  User.findByIdAndUpdate(req.body.id, { $set: { pfp: req.body.pfp } }).then((user) => {
    socketManager.getIo().emit("newpfp", user);
    res.send({});
  });
});

router.post("/updatemood", (req, res) => {
  config.headers.Authorization = `Bearer ${req.body.accessToken}`; // update Spotify access token
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
            await trainingDataMood.save().then(() => {
              // socketManager.getIo.emit("updatedmood", req.body.mood);
              res.send({});
            });
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
  config.headers.Authorization = `Bearer ${req.query.accessToken}`; // update Spotify access token

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
  config.headers.Authorization = `Bearer ${req.query.accessToken}`; // update Spotify access token

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
const query = "https://api.spotify.com/v1/recommendations?q=";

// get user personalized playlist
router.get("/customizedplaylist", (req, res) => {
  config.headers.Authorization = `Bearer ${req.query.accessToken}`; // update Spotify access token

  Mood.findOne({ creator: req.query.id, mood: req.query.mood }).then((userMood) => {
    let finalQuery = query;
    if (userMood) {
      let seedsRemaining = MAX_SEED;
      let seedArtists = "&seed_artists=";
      for (let i = 0; i < Math.min(2, userMood.artists.length); ++i) {
        let rand = Math.floor(Math.random() * userMood.artists.length);
        let artistId = userMood.artists[rand];
        seedArtists += artistId + ",";
        seedsRemaining--;
      }
      finalQuery += seedArtists;
      let seedTracks = "&seed_tracks=";
      for (let i = 0; i < Math.min(seedsRemaining, userMood.tracks.length); ++i) {
        let rand = Math.floor(Math.random() * userMood.tracks.length);
        let songId = userMood.tracks[rand];
        seedTracks += songId + ",";
      }
      finalQuery += seedTracks;
      axios.get(finalQuery, config).then((response) => {
        res.send(response.data);
      });
    } else {
      res.send({});
    }
  });
});

// get playlist built from training data
router.get("/defaultplaylist", async (req, res) => {
  config.headers.Authorization = `Bearer ${req.query.accessToken}`; // update Spotify access token

  await Mood.findOne({ mood: req.query.mood, creator: "training data" }).then(
    async (trainingDataMood) => {
      let finalQuery = query;
      if (trainingDataMood) {
        let seedsRemaining = MAX_SEED;
        let seedArtists = "&seed_artists=";
        for (let i = 0; i < Math.min(2, trainingDataMood.artists.length); ++i) {
          let rand = Math.floor(Math.random() * trainingDataMood.artists.length);
          let artistId = trainingDataMood.artists[rand];
          seedArtists += artistId + ",";
          seedsRemaining--;
        }
        finalQuery += seedArtists;
        let seedTracks = "&seed_tracks=";
        for (let i = 0; i < Math.min(seedsRemaining, trainingDataMood.tracks.length); ++i) {
          let rand = Math.floor(Math.random() * trainingDataMood.tracks.length);
          let songId = trainingDataMood.tracks[rand];
          seedTracks += songId + ",";
        }
        finalQuery += seedTracks;
        await axios.get(finalQuery, config).then((response) => {
          res.send(response.data);
        });
      } else {
        const newQuery = "https://api.spotify.com/v1/browse/new-releases?q=&country=US";
        const latestTracks = { latestTracks: [] };
        await axios.get(newQuery, config).then(async (response) => {
          for (const album of response.data.albums.items) {
            const albumQuery = "https://api.spotify.com/v1/albums/" + album.id;
            await axios.get(albumQuery, config).then(async (albumReponse) => {
              let rand = Math.floor(Math.random() * albumReponse.data.tracks.items.length);
              let trackData = albumReponse.data.tracks.items[rand];
              let artistId = trackData.artists[0].id;
              const artistQuery = "https://api.spotify.com/v1/artists/" + artistId;
              await axios.get(artistQuery, config).then((artistData) => {
                trackData.images = artistData.data.images;
                latestTracks.latestTracks.push(trackData);
              });
            });
          }
        });
        res.send(latestTracks);
      }
    }
  );
});

router.post("/likesong", (req, res) => {
  // update playlist song to user data
  const asyncProcess = async () => {
    await Mood.findOne({ creator: req.body.userId, mood: req.body.mood }).then(async (userMood) => {
      if (userMood) {
        await Mood.findOneAndUpdate(
          { creator: req.body.userId, mood: req.body.mood },
          { $push: { tracks: req.body.songId } }
        );
      } else {
        const customMood = new Mood({
          mood: req.body.mood,
          artists: [],
          tracks: [req.body.songId],
          creator: req.body.userId,
        });
        await customMood.save();
      }
    });
  };

  // update playlist song to training data
  const asyncProcess2 = async () => {
    await Mood.findOne({ creator: "training data", mood: req.body.mood }).then(
      async (trainingDataMood) => {
        if (trainingDataMood) {
          await Mood.findOneAndUpdate(
            { creator: "training data", mood: req.body.mood },
            { $push: { tracks: req.body.songId } }
          ).then(res.send({}));
        } else {
          const trainingDataMood = new Mood({
            mood: req.body.mood,
            artists: [],
            tracks: [req.body.songId],
            creator: "training data",
          });
          await trainingDataMood.save().then(res.send({}));
        }
      }
    );
  };

  asyncProcess().then(() => {
    asyncProcess2();
  });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
