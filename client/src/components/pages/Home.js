import React from "react";
import "../../utilities.css";
import "./Home.css";
import { get, post } from "../../utilities";
import { useState, useEffect } from "react";
import MoodModal from "../modules/MoodModal";
import ProfileModal from "../modules/ProfileModal";

const Home = (props) => {
  const [moodSelectors, setMoodSelectors] = useState([]);
  const [moodPrompt, toggleMoodPrompt] = useState(false);
  const [currentMood, toggleCurrentMood] = useState("");
  const moods = ["NEUTRAL", "CHEERFUL", "SAD", "MOTIVATED", "ROMANTIC", "INTROSPECTIVE", "CHILL"];

  useEffect(() => {
    let moodButtons = moods.map((mood) => (
      <button
        key={mood}
        className="mood-selector u-pointer u-inlineBlock"
        onClick={() => {
          toggleCurrentMood(mood);
          toggleMoodPrompt(true);
        }}
      >
        {mood}
      </button>
    ));
    setMoodSelectors(moodButtons);
  }, []);

  return (
    <>
      <div className="u-textCenter">
        <h4>HOW DO YOU FEEL TODAY?</h4>
        <div className="mood-selector-scroll">{moodSelectors}</div>
        {props.showProfile ? (
          <ProfileModal userId={props.userId} setShowProfile={props.setShowProfile} />
        ) : (
          <></>
        )}
        {moodPrompt ? (
          <MoodModal mood={currentMood} userId={props.userId} toggleMoodPrompt={toggleMoodPrompt} />
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default Home;
