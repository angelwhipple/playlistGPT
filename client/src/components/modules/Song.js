import React, { useEffect, useState } from "react";
import "./Song.css";

const Song = (props) => {
  return (
    <div className="song-container">
      <img src={props.imageURL}></img>
    </div>
  );
};

export default Song;
