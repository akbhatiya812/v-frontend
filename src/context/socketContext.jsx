import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { Usecustem } from "./chat";

const socketContext = createContext();

export const useSocket = () => useContext(socketContext);

export const SocketProvider = ({ children }) => {
  const { setUsemsg } = Usecustem();
  const [socketId, setSocketId] = useState();
  const [roomId, setRoomId] = useState();
  const navigate = useNavigate();
  const [isWaiting, setIsWaiting] = useState();

  const [roomKey, setRoomKey] = useState();

  const socket = useMemo(
    () =>
      io(process.env.REACT_APP_SOCKET_API_BASE_URL, { withCredentials: true }),
    []
  );

  socket.on("connect", () => {
    setSocketId(socket.id);
  });

  useEffect(() => {
    console.log(roomKey);
    socket.on("joined-room", (x) => {
      console.log("new room joined", x.roomKey);
      setRoomId(x.roomKey);
      setIsWaiting(x.flag);
    });
    socket.on("user-disconnected", ({ disconnectedUser }) => {
      socket.emit("leave-room", roomId);
      const roomKey = uuidv4();
      setRoomId(roomKey);
      socket.emit("join-room", roomKey);
    });

    socket.on('chat-closed', ({leavedUser, roomKey}) => {
      socket.emit("leave-room", roomKey);
      setUsemsg([])
      roomKey = uuidv4();
      setRoomId(roomKey);
      socket.emit("join-room", roomKey);
    })


    return () => {
      socket.off("joined-room");
      socket.off("user-disconnected");
      socket.off("chat-closed");
    };
  }, [socket]); 

  // useEffect(() => {
  //   if(roomKey){
  //     // console.log(roomKey);
  //     joinRandomRoom();
  //   }
  // },  [roomKey])

  const joinRandomRoom = () => {
    // const roomKey = uuidv4();
    if(roomKey){
      console.log("here",roomKey);
      socket.emit("join-room", roomKey);
    }
  };

  const handleExitChat = () => {
    setUsemsg([])
    navigate("/");
    socket.emit("exit-chat", roomId);
    setRoomId('');
  }

  const value = {
    socket,
    socketId,
    roomId,
    setRoomId,
    isWaiting,
    setIsWaiting,
    joinRandomRoom,
    handleExitChat,
    setRoomKey,
    roomKey
  };
  return (
    <socketContext.Provider value={value}>{children}</socketContext.Provider>
  );
};
