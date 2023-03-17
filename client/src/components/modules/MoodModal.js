import React, { useEffect, useState } from "react";
import { get, post } from "../../utilities";
import "./Modal.css";

const MoodModal = (props) => {
  const [songInput, setSongInput] = useState("");
  const [artistInput, setArtistInput] = useState("");

  const handleInput_song = (event) => {
    setSongInput(event.target.value);
  };

  const handleInput_artist = (event) => {
    setArtistInput(event.target.value);
  };

  const updateMood = (event, field) => {
    event.preventDefault();
    const body = { id: props.userId, mood: props.mood };
    if (field === "song" && songInput) {
      body["song"] = songInput;
      setSongInput("");
    }
    if (field === "artist" && artistInput) {
      body["artist"] = artistInput;
      setArtistInput("");
    }
    post("/api/updatemood", body);
    props.toggleMoodPrompt(false);
  };
  return (
    <div className="modal-Container">
      <div className="modal-Content">
        <h4>CUSTOMIZE YOUR {props.mood} PLAYLIST</h4>
        <div className="u-flexColumn">
          <div className="u-flex-justifyCenter">
            <label className="col-30">ADD AN ARTIST</label>
            <input
              className="col-70"
              type="text"
              placeholder="enter artist name"
              onChange={handleInput_artist}
            ></input>
            <button
              type="submit"
              value="Submit"
              className="modal-button u-pointer"
              onClick={(event) => {
                updateMood(event, "artist");
              }}
            >
              submit artist
            </button>
          </div>
          <div className="u-flex-justifyCenter">
            <label className="col-30">ADD A SONG</label>
            <input
              className="col-70"
              type="text"
              placeholder="enter song name"
              onChange={handleInput_song}
            ></input>
            <button
              type="submit"
              value="Submit"
              className="modal-button u-pointer"
              onClick={(event) => {
                updateMood(event, "song");
              }}
            >
              submit song
            </button>
          </div>
        </div>
        <button
          className="modal-button u-pointer"
          onClick={() => {
            props.toggleMoodPrompt(false);
          }}
        >
          quit
        </button>
      </div>
    </div>
  );
};

export default MoodModal;
