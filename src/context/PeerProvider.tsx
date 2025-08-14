"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface WebRTCContextType {
  peer: RTCPeerConnection | null;
  createAnswer: (
    offer: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescriptionInit | undefined>;
  createOffer: () => Promise<RTCSessionDescriptionInit | undefined>;
  setRemoteAns: (ans: RTCSessionDescriptionInit) => Promise<void>;
  sendStream: (stream: MediaStream | undefined) => void;
  remoteStream: MediaStream | undefined;
  createNegotiationAnswer: (
    offer: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescriptionInit | undefined>;
}

const PeerContext = createContext<WebRTCContextType | null>(null);

export const PeerProvider = (props: PropsWithChildren) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>();
  const isOfferSet = useRef(false);
  const isNegotiationOfferSet = useRef(false);
  const peer = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });
  }, []);

  const createOffer = async () => {
    if (!peer) return;

    const offer = await peer.createOffer();
    await peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  };

  // const delay = (ms: number) =>
  //   new Promise<void>((resolve) => setTimeout(resolve, ms));

  const createAnswer = async (offer: any) => {
    if (!peer) return;

    if (peer.signalingState !== "stable" || isOfferSet.current) return;

    isOfferSet.current = true;

    await peer.setRemoteDescription(offer);
    console.log("answer created");
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(new RTCSessionDescription(answer));

    return answer;
  };

  async function createNegotiationAnswer(offer: RTCSessionDescriptionInit) {
    if (!peer) return;

    if (peer.signalingState !== "stable") {
      // Wait until connection is ready for new negotiation
      await new Promise((resolve) => {
        const check = () => {
          if (peer.signalingState === "stable") {
            peer.removeEventListener("signalingstatechange", check);
            resolve(null);
          }
        };
        peer.addEventListener("signalingstatechange", check);
      });
    }
    console.log("this is offer" , offer)
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  }

  const setRemoteAns = async (ans: any) => {
    if (!peer) return;

    await peer.setRemoteDescription(ans);
  };

  const sendStream = (stream: MediaStream | undefined) => {
    if (!peer || !stream) return;

    const tracks = stream.getTracks();
    for (const track of tracks) {
      peer.addTrack(track, stream);
    }
    console.log("stream added");
  };

  const handleTrackEvents = useCallback((ev: RTCTrackEvent) => {
    const streams = ev.streams;
    console.log("got the stream :", streams);
    setRemoteStream(streams[0]);
  }, []);

  useEffect(() => {
    if (!peer) return;

    peer.addEventListener("track", handleTrackEvents);

    return () => {
      peer.removeEventListener("track", handleTrackEvents);
    };
  }, [peer, handleTrackEvents]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createAnswer,
        createOffer,
        setRemoteAns,
        sendStream,
        remoteStream,
        createNegotiationAnswer,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => {
  const context = useContext(PeerContext);
  if (!context) {
    throw Error("no peer context foiund");
  }
  return context;
};
