"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";

function Page() {
  const [name, setName] = useState<string>();
  const [roomId, setRoomId] = useState<string>();
  const { socket, callUserData } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    socket.on("joined-room", (data) => {
      console.log("joined the room", data.name);
      const { roomId } = data;
      router.push(`/Room/${roomId}`);
    });
    return () => {
      socket.off("message");
    };
  }, [socket]);

  const btnHandler = () => {
    if (!socket) return;

    socket.emit("join-room", { name, roomId });
  };

  return (
    <div className="bg-gray-800 w-screen h-screen flex items-center justify-center">
      <div className="border-4 border-black p-10 ">
        <h1>This is a lobby</h1>
        <input
          type="text"
          placeholder="Enter name"
          className="border-2 border-black mt-5 mr-5 p-1 "
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter RoomId"
          className="border-2 border-black mt-5 p-1"
          onChange={(e) => setRoomId(e.target.value)}
        />
        <br />
        <button
          onClick={btnHandler}
          className="bg-green-500 mt-5 p-2 rounded-md"
        >
          Enter
        </button>
      </div>
    </div>
  );
}

export default Page;
