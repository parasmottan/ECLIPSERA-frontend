"use client";
import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { io } from "socket.io-client";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Maximize,
  Minimize,
  MessageSquare,
  X,
  Send,
} from "lucide-react";

const socket = io("https://eclipsera-backend.onrender.com");

export default function NetflixPlayer({ src, roomId }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimeout = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.emit("join_room", roomId);
    socket.on("receive_message", (data) => setMessages((prev) => [...prev, data]));
    return () => socket.off("receive_message");
  }, [roomId]);

  useEffect(() => {
    const video = videoRef.current;

    socket.on("play_video", ({ currentTime }) => {
      if (!video) return;
      video.currentTime = currentTime;
      video.play();
      setIsPlaying(true);
    });

    socket.on("pause_video", ({ currentTime }) => {
      if (!video) return;
      video.pause();
      video.currentTime = currentTime;
      setIsPlaying(false);
    });

    socket.on("seek_video", ({ currentTime }) => {
      if (!video) return;
      video.currentTime = currentTime;
    });

    return () => {
      socket.off("play_video");
      socket.off("pause_video");
      socket.off("seek_video");
    };
  }, []);

  const emitVideoAction = (action) => {
    const video = videoRef.current;
    if (!roomId || !socket) return;
    socket.emit(`${action}_video`, { roomId, currentTime: video.currentTime });
  };

  useEffect(() => {
    if (!src) return;
    const video = videoRef.current;
    let hls;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    const handleEnded = () => setIsPlaying(false);
    video.addEventListener("ended", handleEnded);

    return () => {
      if (hls) hls.destroy();
      video.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const resetHideTimer = () => {
    setShowControls(true);
    clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowControls(false), 4000);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mousemove", resetHideTimer);
    container.addEventListener("click", resetHideTimer);
    resetHideTimer();

    return () => {
      clearTimeout(hideTimeout.current);
      container.removeEventListener("mousemove", resetHideTimer);
      container.removeEventListener("click", resetHideTimer);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      emitVideoAction("pause");
    } else {
      video.play();
      emitVideoAction("play");
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds) => {
    const video = videoRef.current;
    video.currentTime += seconds;
    emitVideoAction("seek");
  };

  const handleMute = () => {
    const video = videoRef.current;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolume = (e) => {
    const newVol = e.target.value;
    const video = videoRef.current;
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const newTime = (e.target.value / 100) * video.duration;
    video.currentTime = newTime;
    setProgress(e.target.value);
    emitVideoAction("seek");
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { text: input, sender: "me" };
    setMessages((p) => [...p, newMsg]);
    socket.emit("send_message", { roomId, text: input, sender: "user" });
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-2xl overflow-hidden flex justify-center items-center aspect-video shadow-2xl group"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        onTimeUpdate={handleTimeUpdate}
        playsInline
      />

      {/* 💬 Fullscreen Chat (4K safe) */}
      {isFullscreen && showChat && (
        <div className="absolute right-[clamp(1rem,3vw,3rem)] bottom-[clamp(4rem,6vh,8rem)] w-[clamp(80%,40vw,30%)] max-h-[60%] bg-black/60 border border-white/10 rounded-2xl text-white flex flex-col overflow-hidden backdrop-blur-md animate-fadeIn">
          <div className="flex justify-between items-center px-[clamp(0.8rem,1vw,1.2rem)] py-[clamp(0.6rem,1vh,1rem)] border-b border-white/10">
            <h1 className="font-semibold text-[clamp(0.9rem,1vw,1.2rem)]">
              Live Chat
            </h1>
            <button onClick={() => setShowChat(false)} className="hover:text-red-500 transition">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-xl text-[clamp(0.8rem,0.9vw,1rem)] max-w-[80%] ${
                  msg.sender === "me"
                    ? "bg-red-600/70 self-end ml-auto"
                    : "bg-[#1f1f1f]/80 self-start"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 border-t border-white/10">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-[clamp(0.5rem,0.8vw,0.8rem)] bg-[#1a1a1a]/70 rounded-full text-[clamp(0.8rem,0.9vw,1rem)] outline-none focus:ring-1 focus:ring-red-600"
            />
            <button
              onClick={handleSend}
              className="p-[clamp(0.5rem,0.8vw,0.9rem)] bg-red-600 hover:bg-red-700 rounded-full transition"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* 🎛️ Controls (scaled for 4K) */}
      <div
        className={`absolute bottom-0 w-full px-[clamp(1rem,3vw,4rem)] py-[clamp(0.8rem,2vh,2rem)] bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-[clamp(0.6rem,1vh,1.2rem)] transition-all duration-500 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <input
          type="range"
          value={progress}
          onChange={handleSeek}
          className="w-full accent-red-600 cursor-pointer h-[clamp(3px,0.5vh,6px)]"
        />

        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-[clamp(0.6rem,1vw,1.2rem)]">
            <button onClick={() => skipTime(-10)}>
              <Rewind size={clamp(20, "1.6vw", 28)} />
            </button>
            <button
              onClick={togglePlay}
              className="bg-red-600 hover:bg-red-700 transition p-[clamp(0.6rem,1vw,1.2rem)] rounded-full"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button onClick={() => skipTime(10)}>
              <FastForward size={24} />
            </button>
            <button onClick={handleMute}>
              {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolume}
              className="hidden sm:block w-[clamp(60px,6vw,120px)] accent-red-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-[clamp(0.8rem,1.5vw,2rem)]">
            {isFullscreen && !showChat && (
              <button
                onClick={() => setShowChat(true)}
                className="hover:text-red-500 transition"
              >
                <MessageSquare size={22} />
              </button>
            )}
            <button onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
