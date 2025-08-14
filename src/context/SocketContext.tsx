"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

type SocketContextType = {
  socket: Socket | null;
  callUserData: any; // You can replace `any` with your data type
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [callUserData, setCallUserData] = useState();

  if (!socketRef.current) {
    socketRef.current = getSocket();
  }

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connect) socket?.connect();
    socket?.on("call-user", (data) => {
      setCallUserData(data);
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      socket: socketRef.current,
      callUserData,
    }),
    [callUserData] // only changes when callUserData changes
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error("Socket not available");
  return socket;
};
