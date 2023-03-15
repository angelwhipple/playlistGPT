import React, { useEffect, useState } from "react";
import { get, post } from "../../utilities";
import "./Modal.css";

const MoodModal = (props) => {
  return (
    <div className="modal-Container">
      <div className="modal-Content">
        <h4>CUSTOMIZE YOUR {props.mood} PLAYLIST</h4>
        <div className="u-flexColumn">
          <div className="u-flex-justifyCenter">
            <label className="col-30">ADD AN ARTIST</label>
            <input className="col-70" type="text" placeholder="enter artist name"></input>
            <button type="submit" value="Submit" className="modal-button u-pointer">
              submit artist
            </button>
          </div>
          <div className="u-flex-justifyCenter">
            <label className="col-30">ADD A SONG</label>
            <input className="col-70" type="text" placeholder="enter song name"></input>
            <button type="submit" value="Submit" className="modal-button u-pointer">
              submit song
            </button>
          </div>
        </div>
        <button
          className="modal-button u-pointer"
          onClick={() => {
            props.setShowMoodPrompt(false);
          }}
        >
          quit
        </button>
      </div>
    </div>
  );
};

export default MoodModal;
