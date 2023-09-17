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
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const moods = ["NEUTRAL", "CHEERFUL", "SAD", "MOTIVATED", "ROMANTIC", "HYPE", "CHILL"];

  useEffect(() => {
    let moodButtons = moods.map((mood) => (
      <button
        key={mood}
        className="mood-selector u-pointer u-inlineBlock"
        onClick={() => {
          toggleCurrentMood(mood);
          toggleMoodPrompt(true);
          props.setShowPlaylist(false);
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
          props.userId ? (
            <MoodModal
              mood={currentMood}
              userId={props.userId}
              toggleMoodPrompt={toggleMoodPrompt}
              setPlaylist={setPlaylist}
              setLoading={setLoading}
              setShowPlaylist={props.setShowPlaylist}
              accessToken={props.accessToken}
            />
          ) : (
            <MoodModal
              mood={currentMood}
              toggleMoodPrompt={toggleMoodPrompt}
              setLoading={setLoading}
              setPlaylist={setPlaylist}
              setShowPlaylist={props.setShowPlaylist}
              accessToken={props.accessToken}
            />
          )
        ) : (
          <></>
        )}
        {!loading && playlist.length !== 0 && props.showPlaylist ? (
          <div className="playlist-container">
            <h3 className="playlist-header">YOUR {currentMood} PLAYLIST</h3>
            <div className="playlist-scroll">{playlist}</div>
          </div>
        ) : loading ? (
          <div className="center">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default Home;
