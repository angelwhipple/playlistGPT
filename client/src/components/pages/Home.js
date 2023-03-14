import React from "react";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./Home.css";
import { get, post } from "../../utilities";
import { useState, useEffect } from "react";

const Skeleton = ({ userId, handleLogin, handleLogout }) => {
  const [moodSelectors, setMoodSelectors] = useState([]);
  const moods = ["NEUTRAL", "CHEERFUL", "SAD", "MOTIVATED", "ROMANTIC", "INTROSPECTIVE", "CHILL"];

  useEffect(() => {
    let moodButtons = moods.map((mood) => (
      <button className="mood-selector u-pointer u-inlineBlock" onClick={() => {}}>
        {mood}
      </button>
    ));
    setMoodSelectors(moodButtons);
  }, []);

  return (
    <>
      <div className="u-textCenter">
        <h4>how are you feeling today?</h4>
        <div className="mood-selector-scroll">{moodSelectors}</div>
      </div>
    </>
  );
};

export default Skeleton;
