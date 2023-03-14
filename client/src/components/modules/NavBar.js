import React, { useState, useEffect } from "react";
import { navigate } from "@gatsbyjs/reach-router";
import { get, post } from "../../utilities";
import { socket } from "../../client-socket";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import "./NavBar.css";

const GOOGLE_CLIENT_ID = "577941677274-3aeilnjtp2hj98r8jvcsa6jvkoq9r5kc.apps.googleusercontent.com";

const NavBar = (props) => {
  const [profilePicture, setProfilePicture] = useState("");

  if (props.userId) {
    get("/api/whoami", { id: props.userId }).then((user) => {
      setProfilePicture(user.pfp);
    });
  }

  socket.on("newpfp", (user) => {
    setProfilePicture(user.pfp);
  });

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <nav className="navBar-container">
        {props.userId ? (
          <div className="u-flex">
            <img src={profilePicture} className="profile-icon" />
            <div>
              <button
                className="logout-button u-pointer"
                onClick={() => {
                  googleLogout();
                  props.handleLogout();
                }}
              >
                logout
              </button>
            </div>
          </div>
        ) : (
          <GoogleLogin onSuccess={props.handleLogin} onError={(err) => console.log(err)} />
        )}
      </nav>
    </GoogleOAuthProvider>
  );
};

export default NavBar;
