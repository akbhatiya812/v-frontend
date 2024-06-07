import React, { useRef, useState, useEffect } from "react";
import Peer from "peerjs";
import styles from "./style.module.css";
import { v4 as uuidv4 } from "uuid";

const TempVideoPage = () => {
  const [peerId, setPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);

  useEffect(() => {
    const peer = new Peer(undefined, {
      host: process.env.REACT_APP_PEER_HOST,
      port: process.env.REACT_APP_PEER_PORT,
      path: '/peerjs',
      secure: process.env.REACT_APP_PEER_SECURE === "true",
      debug: 3,
    });

    peer.on("open", (id) => {
      setPeerId(id);
      console.log("akash", id);
    });

    peer.on("call", (call) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        localVideoRef.current.srcObject = stream;
        call.answer(stream); // Answer the call with an A/V stream.
        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
        });
      });
    });

    peerRef.current = peer;

    return () => {
      peer.disconnect();
    }
  }, []);

  const startCall = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localVideoRef.current.srcObject = stream;
      const call = peerRef.current.call(remotePeerId, stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
      });
    });
  };

  const copytext = (x) => {
    navigator.clipboard.writeText(x);
  };

  return (
    <div>
      <h1>Video Chat</h1>
      <div>
        <input
          type="text"
          placeholder="This device Peer ID"
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
        />
        <button onClick={() => copytext(peerId)}>Copy</button>
      </div>
      <video
        ref={localVideoRef}
        className={styles.video}
        autoPlay
        playsInline
      ></video>
      <video
        ref={remoteVideoRef}
        className={styles.video}
        autoPlay
        playsInline
      ></video>
      <p>this device's peerId : {peerId} </p>
      <div>
        <input
          type="text"
          placeholder="Remote Peer ID"
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
        />
        <button onClick={startCall}>Start Call</button>
      </div>
    </div>
  );
};

export default TempVideoPage;
