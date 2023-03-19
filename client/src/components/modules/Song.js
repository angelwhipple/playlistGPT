import React, { useRef, useState } from "react";
import { FaRegHeart } from "react-icons/fa";
import { AiFillPlayCircle } from "react-icons/ai";
import { AiFillPauseCircle } from "react-icons/ai";
import { get, post } from "../../utilities";
import "./Song.css";

const Song = (props) => {
  const [paused, setPaused] = useState(true);
  const [favorited, setFavorited] = useState(false);

  const playback = useRef(new Audio(props.playbackURL));
  playback.current.loop = true;

  const startPlayback = (event) => {
    playback.current.play();
    setPaused(false);
  };

  const pausePlayback = (event) => {
    playback.current.pause();
    setPaused(true);
  };

  const updateMood = (event) => {
    if (props.userId) {
      post("/api/likesong", { userId: props.userId, songId: props.songId, mood: props.mood });
    }
    setFavorited(true);
  };

  return (
    <div className="song-container">
      <div className="u-flex">
        <img className="song-image" src={props.imageURL}></img>
        <div className="song-info">
          <p className="song-name">{props.name}</p>
          <p className="song-artist">by {props.artist}</p>
          {paused ? (
            <AiFillPlayCircle onClick={startPlayback} className="play-button u-pointer" />
          ) : (
            <AiFillPauseCircle onClick={pausePlayback} className="play-button u-pointer" />
          )}
          <a href={props.spotifyURL} target="_blank">
            <button className="redirect-button u-pointer">LISTEN ON SPOTIFY</button>
          </a>
          {!favorited ? (
            <div className="favorite-button u-pointer">
              <FaRegHeart onClick={updateMood} />
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
};

export default Song;
