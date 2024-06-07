import React, { useRef, useState, useEffect } from "react";
import Peer from "peerjs";
import styles from "./style.module.css";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "../../context/socketContext";

const TempVideoPage = () => {

  const [peerId, setPeerId] = useState("");
 
  const [incomingCall, setIncomingCall] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const [call,setCall] = useState();

  const {remotePeerId, setRemotePeerId} = useSocket();

  useEffect(() => {
    const userId = uuidv4();
    const peer = new Peer(userId);
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
    });

    peer.on("call", (incomingCall) => {
      setCall(incomingCall);
      setIncomingCall(incomingCall);
    });

    return () => {
      peer.disconnect();
    }
  }, []);

  const initiateCall = (stream) => {
    const outgoingCall = peerRef.current.call(remotePeerId,stream);
    outgoingCall.on("stream", (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
    });
    setCall(outgoingCall);
  }

  const startCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        const outgoingCall = peerRef.current.call(remotePeerId, stream);
        outgoingCall.on("stream", (remoteStream) => {
          const emptyStream  = new MediaStream();
          remoteVideoRef.current.srcObject = emptyStream;
        });
        setCall(outgoingCall);
      }).catch((error) => {
        if(error.name === "NotFoundError" || error.name === "DevicesNotFoundError"){
          const emptyStream  = new MediaStream();
          initiateCall(emptyStream)
        }
      });
  };

  const answerIncomingCall = (stream) => {
    incomingCall.answer(stream);
    incomingCall.on("stream", (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
    });
    setCall(incomingCall);
    setIncomingCall(null);    
  }
 
  const answerCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        answerIncomingCall(stream);
      }).catch((error) => {
        if(error.name === "NotFoundError" || error.name === "DevicesNotFoundError"){
          const emptyStream  = new MediaStream();
          answerIncomingCall(emptyStream)
        }
    });
  };

  const endCall = () => {
    if (call) {
      call.close();
      setCall(null);
      remoteVideoRef.current.srcObject = null;
      localVideoRef.current.srcObject = null;
    }
  };


  return (
    <div>
      <h1>Video Chat</h1>
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
      <p>this devices peerId : {peerId} </p>{" "}
      <button onClick={() => navigator.clipboard.writeText(peerId)}>
        Copy
      </button>
      <div>
        <input
          type="text"
          placeholder="Remote Peer ID"
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
        />
        <button onClick={startCall}>Start Call</button> 
      </div>
      <div>
        {incomingCall && (
            <button
              onClick={answerCall}
              className="bg-green-500 text-white p-2 rounded"
            >
              Answer Call
            </button>
        )}
        {call && (
          <button
            onClick={endCall}
            className="bg-red-500 text-white p-2 rounded"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default TempVideoPage;
