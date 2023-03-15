import React, { useEffect, useState } from "react";
import { get, post } from "../../utilities";
import "./Modal.css";

const ProfileModal = (props) => {
  return (
    <div className="modal-Container">
      <div className="modal-Content">
        <h4>USER PROFILE</h4>
        <button
          className="modal-button u-pointer floatRight"
          onClick={() => {
            props.setShowProfile(false);
          }}
        >
          done
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
