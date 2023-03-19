import React, { useEffect, useState } from "react";
import { FaRegHeart } from "react-icons/fa";
import { AiFillPlayCircle } from "react-icons/ai";
import { get, post } from "../../utilities";
import "./Song.css";

const Song = (props) => {
  let playback = new Audio(props.playbackURL);

  const startPlayback = (event) => {
    playback.play();
  };

  const updateMood = (event) => {
    if (props.userId) {
      post("/api/likesong", { userId: props.userId, songId: props.songId, mood: props.mood });
    }
  };

  return (
    <div className="song-container">
      <div className="u-flex">
        <img className="song-image" src={props.imageURL}></img>
        <div className="song-info">
          <p className="song-name">{props.name}</p>
          <p className="song-artist">by {props.artist}</p>
          <AiFillPlayCircle onClick={startPlayback} className="play-button u-pointer" />
          <a href={props.spotifyURL} target="_blank">
            <button className="redirect-button u-pointer">LISTEN ON SPOTIFY</button>
          </a>
          <div className="favorite-button u-pointer">
            <FaRegHeart onClick={updateMood} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Song;
