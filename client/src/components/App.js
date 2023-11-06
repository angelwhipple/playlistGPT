import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import jwt_decode from "jwt-decode";

import NotFound from "./pages/NotFound.js";
import Home from "./pages/Home.js";
import NavBar from "./modules/NavBar.js";

import "../utilities.css";

import { socket } from "../client-socket.js";

import { get, post } from "../utilities";

/**
 * Define the "App" component
 */
const App = () => {
  const [userId, setUserId] = useState(undefined);
  const [showProfile, setShowProfile] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    get("/api/whoami").then((user) => {
      if (user._id) {
        // they are registed in the database, and currently logged in.
        setUserId(user._id);
      }
    });
    if (accessToken === "") {
      refreshToken();
    }
  }, []);

  useEffect(() => {
    console.log(`Spotify access token: ${accessToken}`);
  }, [accessToken]);

  const refreshToken = () => {
    get("/api/spotify").then(async (res) => {
      setAccessToken((prev) => res.accessToken);
      setTimeout(refreshToken, 3540000); // set a timer to refresh access token after 59 minutes (in ms)
    });
  };

  const handleLogin = (credentialResponse) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken);
    console.log(`Logged in as ${decodedCredential.name}`);
    post("/api/login", { token: userToken }).then((user) => {
      setUserId(user._id);
      post("/api/initsocket", { socketid: socket.id });
      post("/api/setpfp", { id: user._id, pfp: decodedCredential.picture });
    });
    setShowPlaylist(false);
  };

  const handleLogout = () => {
    setUserId(undefined);
    post("/api/logout");
  };

  return (
    <>
      <NavBar
        userId={userId}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        setShowProfile={setShowProfile}
        setShowPlaylist={setShowPlaylist}
      />
      <Routes>
        <Route
          path="/"
          element={
            <Home
              path="/"
              handleLogin={handleLogin}
              handleLogout={handleLogout}
              userId={userId}
              showProfile={showProfile}
              setShowProfile={setShowProfile}
              setShowPlaylist={setShowPlaylist}
              showPlaylist={showPlaylist}
              accessToken={accessToken}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
