/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

// spotify code: AQCRbsfGo6V1zkrLNPoSdO6tjhLTD5RkvWUe-jtQKNPz2VXeNFuZaknBK6U-GLpOQVxsS74ET92Whd0uLupEUZgXEVawYBTfbrHIUTU8vN_GM6Vn_4CmxAMa96Xb5X_3R2u9dhQ2xQ0Qq9pMWF7EsZUtdHG7GlBiXw
// spotify access token: {"access_token":"BQDrl41UB2Sid65FL716io1NVkoAZ8ZYGXlj_Ew-Uog00bGCdznld704AQQw_5Gj4BarZGKFH-iz3Pq_44rKXnqXQ9eOKQpWZg9N6McXGfNREoocx0tqpIXRi4p2BF7HSEDbFfi8iFU6wXJxRO09DzXXRwsKM-j1dKtJvOABUQQ4-RtcEHnF1dekpZrmpiBcs0to1C4","token_type":"Bearer","expires_in":3600,"refresh_token":"AQBmxQivBSMpNmvegbqos3QpOw8FMC_U9muPYXIdWkVSqZEu-aNMbuvfA-8XAkshkZuKEXxzY8wub3GFKQNY5BJT-XsvTC6GYVrUBAc1R6OUfieFi5XNHyvOmTXEvgfSdPg"}

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

// spotify API
const { default: axios } = require("axios");

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
    socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
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

// const config = {
//   headers: {
//     Authorization:
//       "Bearer BQDrl41UB2Sid65FL716io1NVkoAZ8ZYGXlj_Ew-Uog00bGCdznld704AQQw_5Gj4BarZGKFH-iz3Pq_44rKXnqXQ9eOKQpWZg9N6McXGfNREoocx0tqpIXRi4p2BF7HSEDbFfi8iFU6wXJxRO09DzXXRwsKM-j1dKtJvOABUQQ4-RtcEHnF1dekpZrmpiBcs0to1C4",
//   },
// };
// axios
//   .get("https://api.spotify.com/v1/search?q=playboicarti&type=artist", config)
//   .then((response) => {
//     console.log(response);
//   });

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
