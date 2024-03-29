import React, { useEffect, useState } from "react";
import { get, post } from "../../utilities";
import "./Modal.css";
import Song from "./Song";
import { socket } from "../../client-socket";

const MoodModal = (props) => {
  const [songInput, setSongInput] = useState("");
  const [artistInput, setArtistInput] = useState("");
  const [customArtists, setCustomArtists] = useState([]);
  const [customSongs, setCustomSongs] = useState([]);

  const updateButtons = () => {
    if (props.userId) {
      get("/api/customsongs", {
        accessToken: props.accessToken,
        id: props.userId,
        mood: props.mood,
      }).then((response) => {
        let tempSongs = [];
        for (const songData of response.songs) {
          tempSongs.push(
            <button
              key={songData.id}
              onClick={() => {
                post("/api/deletesong", {
                  id: props.userId,
                  mood: props.mood,
                  songId: songData.id,
                }).then((response) => {
                  updateButtons();
                });
              }}
              className="song-button u-pointer"
            >
              {songData.name}
            </button>
          );
        }
        setCustomSongs(tempSongs);
      });
      get("/api/customartists", {
        accessToken: props.accessToken,
        id: props.userId,
        mood: props.mood,
      }).then((response) => {
        let tempArtists = [];
        for (const artistData of response.artists) {
          tempArtists.push(
            <button
              key={artistData.id}
              onClick={() => {
                post("/api/deleteartist", {
                  id: props.userId,
                  mood: props.mood,
                  artistId: artistData.id,
                }).then((response) => {
                  updateButtons();
                });
              }}
              className="song-button u-pointer"
            >
              {artistData.name}
            </button>
          );
        }
        setCustomArtists(tempArtists);
      });
    }
  };

  useEffect(() => {
    updateButtons();
  }, []);
  const handleInput_song = (event) => {
    setSongInput(event.target.value);
  };
  const handleInput_artist = (event) => {
    setArtistInput(event.target.value);
  };

  const updateMood = (event, field) => {
    event.preventDefault();
    const body = { id: props.userId, mood: props.mood, accessToken: props.accessToken };
    if (field === "song" && songInput) {
      body["song"] = songInput;
      setSongInput("");
    }
    if (field === "artist" && artistInput) {
      body["artist"] = artistInput;
      setArtistInput("");
    }
    post("/api/updatemood", body).then((response) => {
      updateButtons();
    });
  };

  const generatePlaylists = async () => {
    const recommendedTracks = [];
    let trackData = [];
    if (props.userId) {
      await get("/api/customizedplaylist", {
        accessToken: props.accessToken,
        id: props.userId,
        mood: props.mood,
      }).then((data) => {
        trackData = data.tracks;
      });
    }
    // check if logged out or custom playlist couldnt be made
    if (trackData === undefined || !props.userId) {
      await get("/api/defaultplaylist", { accessToken: props.accessToken, mood: props.mood }).then(
        (defaultData) => {
          // check for training data tracklist or latest albums
          if (defaultData.tracks) {
            trackData = defaultData.tracks;
          } else {
            trackData = defaultData.latestTracks;
          }
        }
      );
    }
    for (const track of trackData) {
      recommendedTracks.push(
        <Song
          key={track.id}
          songId={track.id}
          userId={props.userId}
          mood={props.mood}
          name={track.name}
          artist={track.artists[0].name}
          imageURL={track.album ? track.album.images[0].url : track.images[0].url}
          playbackURL={track.preview_url}
          spotifyURL={track.external_urls.spotify}
        />
      );
    }
    props.setPlaylist(recommendedTracks);
    props.setLoading(false);
  };

  return (
    <div className="modal-Container">
      <div className="modal-Content">
        {props.userId ? (
          <>
            <h4>CUSTOMIZE YOUR {props.mood} PLAYLIST</h4>
            <div className="u-flexColumn">
              {customSongs.length !== 0 ? (
                <div className="u-flex-justifyCenter">
                  <label className="col-30">YOUR SONGS</label>
                  <div className="song-button-scroll">{customSongs}</div>
                </div>
              ) : (
                <></>
              )}
              {customArtists.length !== 0 ? (
                <div className="u-flex-justifyCenter">
                  <label className="col-30">YOUR ARTISTS</label>
                  <div className="song-button-scroll">{customArtists}</div>
                </div>
              ) : (
                <></>
              )}
              <div className="u-flex-justifyCenter">
                <label className="col-30">ADD AN ARTIST</label>
                <input
                  className="col-70"
                  type="text"
                  placeholder="enter artist name"
                  value={artistInput}
                  onChange={handleInput_artist}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      updateMood(event, "artist");
                    }
                  }}
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
                  value={songInput}
                  onChange={handleInput_song}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      updateMood(event, "song");
                    }
                  }}
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
          </>
        ) : (
          <h4>MAKE A {props.mood} PLAYLIST</h4>
        )}
        <div className="u-flex-justifyCenter">
          <button
            className="modal-button u-pointer"
            onClick={() => {
              generatePlaylists();
              props.setLoading(true);
              props.toggleMoodPrompt(false);
              props.setShowPlaylist(true);
            }}
          >
            generate
          </button>
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
    </div>
  );
};

export default MoodModal;
