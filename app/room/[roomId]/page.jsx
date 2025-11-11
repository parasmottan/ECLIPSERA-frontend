"use client";
import React, { useState, useEffect } from "react";
import { Cinzel } from "next/font/google";
import NetflixPlayer from "../../components/NetflixPlayer";
import axios from "axios";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function Page({ params }) {
  const { roomId } = React.use(params);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessages, setStatusMessages] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [fileKey, setFileKey] = useState(null);
  const [valid, setValid] = useState(null);
  const [popup, setPopup] = useState({ visible: false, type: "", message: "", onConfirm: null });
  const router = useRouter();

  // ✅ Verify Room
  useEffect(() => {
    const verifyRoom = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/createroom/${roomId}`);
        if (res.status === 200) setValid(true);
      } catch {
        setValid(false);
        router.push("/");
      }
    };
    verifyRoom();
  }, [roomId, router]);

  // ✅ Socket Setup
  useEffect(() => {
    if (!valid) return;
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    newSocket.emit("join_room", roomId);
    newSocket.on("receive_message", (data) => setMessages((p) => [...p, data]));
    return () => newSocket.disconnect();
  }, [valid, roomId]);

  const handleSend = () => {
    if (!input.trim() || !socket) return;
    const msg = { text: input, sender: "me" };
    setMessages((p) => [...p, msg]);
    socket.emit("send_message", { roomId, text: input, sender: "user" });
    setInput("");
  };
  const handleKeyDown = (e) => e.key === "Enter" && handleSend();

  // 🧠 Fetch existing movie from DB if available
 useEffect(() => {
  if (!valid || !roomId) return; // 🧠 prevent invalid calls

  const fetchRoomVideo = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/movieupload/${roomId}`);
      const data = await res.json();
      if (data.success && data.video?.hlsUrl) {
        setVideoUrl(data.video.hlsUrl);
        setFileKey(data.video.fileKey);
        console.log("🎞 Loaded existing movie:", data.video.hlsUrl);
      } else {
        console.log("No movie found for this room yet.");
      }
    } catch (err) {
      console.error("Error fetching saved movie:", err);
    }
  };

  fetchRoomVideo();
}, [valid, roomId]);


  // ✅ File Upload + Conversion Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      setPopup({
        visible: true,
        type: "warning",
        message: "💀 BRUH, I’m a poor developer — please upload a file under 2GB!",
        onConfirm: () => setPopup({ visible: false }),
      });
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setStatusMessages(["🚀 Upload started...", "Please don’t refresh this page!"]);

      const res = await fetch("http://localhost:5000/api/upload-url");
      const { uploadURL, fileKey } = await res.json();
      setFileKey(fileKey);

      setStatusMessages((p) => [...p, "📤 Uploading movie to cloud..."]);

      const start = Date.now();
      await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: file });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      setStatusMessages((p) => [...p, `✅ Upload completed in ${elapsed}s`, "🎬 Starting conversion..."]);

      const movieUrl = `https://s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_AWS_BUCKET}/${fileKey}`;
      const convertRes = await fetch("http://localhost:5000/api/movieupload/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieUrl, roomId }),
      });

      setStatusMessages((p) => [...p, "⚙️ Processing your movie, please wait..."]);

      const data = await convertRes.json();

      if (data.success) {
        setStatusMessages((p) => [...p, "✅ Conversion completed!", "🍿 Movie is ready to stream!"]);
        setVideoUrl(data.hlsUrl);
      } else {
        setStatusMessages((p) => [...p, "❌ Conversion failed, please try again."]);
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setStatusMessages(["💥 Something went wrong during upload!"]);
    } finally {
      setUploading(false);
    }
  };

  // 🧹 Delete Movie with popup
  const handleDelete = () => {
    setPopup({
      visible: true,
      type: "confirm",
      message: "⚠️ Are you sure you want to delete this movie?",
      onConfirm: async () => {
        setPopup({ visible: false });
        try {
          const res = await fetch("http://localhost:5000/api/movieupload/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey }),
          });
          const data = await res.json();
          if (data.success) {
            setPopup({
              visible: true,
              type: "info",
              message: "🗑️ Movie deleted successfully!",
              onConfirm: () => {
                setVideoUrl(null);
                setFileKey(null);
                setStatusMessages([]);
                setPopup({ visible: false });
              },
            });
          } else {
            setPopup({
              visible: true,
              type: "warning",
              message: "❌ Failed to delete movie. Try again!",
              onConfirm: () => setPopup({ visible: false }),
            });
          }
        } catch (err) {
          console.error("Delete Error:", err);
          setPopup({
            visible: true,
            type: "warning",
            message: "💥 Something went wrong while deleting!",
            onConfirm: () => setPopup({ visible: false }),
          });
        }
      },
    });
  };

  if (valid === null) return <p className="text-white text-center mt-10">Checking room...</p>;
  if (!valid) return null;

  return (
    <div className="w-full min-h-screen bg-[#0D0D0E] text-white flex flex-col overflow-hidden relative">
      {/* 🌫️ Global Popup */}
      {popup.visible && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-[90%] sm:w-[400px] text-center shadow-2xl animate-scaleIn">
            <p className="text-white/90 text-base mb-4">{popup.message}</p>
            <div className="flex justify-center gap-4">
              {popup.type === "confirm" && (
                <button
                  onClick={() => setPopup({ visible: false })}
                  className="px-4 py-2 rounded-full bg-gray-700 text-white/80 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={popup.onConfirm}
                className={`px-4 py-2 rounded-full ${
                  popup.type === "warning" || popup.type === "confirm"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-600 hover:bg-gray-700"
                } text-white transition`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔝 TOP BAR */}
      <div className="w-full h-14 md:h-16 flex justify-between items-center px-4 md:px-8 bg-[#0D0D0E]/90 border-b border-white/5 backdrop-blur-md z-40">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          onClick={() => router.push("/")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E5E5E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"></path>
            <path d="M19 12H5"></path>
          </svg>
          <h1 className="text-sm">Leave</h1>
        </div>
        <h1 className={`text-lg md:text-xl font-bold ${cinzel.variable}`}>ECLIPSERA</h1>
        <div className="px-3 py-1 bg-[#1A1A1A] rounded-full">
          <h1 className="text-xs text-white/60">Room: {roomId}</h1>
        </div>
      </div>

      {/* ⚡ MAIN SECTION */}
      <div className="flex flex-col lg:flex-row w-full flex-1 mt-2 md:mt-4 p-2 md:p-8 gap-3 md:gap-6 h-[calc(100vh-56px)] overflow-hidden">
        {/* 🎬 PLAYER */}
        <div className="w-full lg:w-[70%] bg-[#101010] rounded-2xl p-[3px] shadow-lg flex items-center justify-center relative">
          <div className="w-full h-full rounded-xl overflow-hidden">
            <NetflixPlayer src={videoUrl} roomId={roomId} />
          </div>

          {/* Uploading Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center gap-3 text-center p-6">
              <h1 className="text-lg font-semibold text-white/90 mb-2">🎥 Uploading & Processing</h1>
              {statusMessages.map((msg, i) => (
                <p key={i} className="text-sm text-white/60 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                  {msg}
                </p>
              ))}
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mt-4"></div>
            </div>
          )}
        </div>

        {/* 💬 CHAT PANEL */}
        <div className="w-full lg:w-[30%] flex flex-col h-[calc(100vh-30vh-60px)] sm:h-auto bg-[#151515] rounded-2xl p-[3px] shadow-lg overflow-hidden">
          <div className="bg-[#151515] rounded-xl flex flex-col justify-between overflow-hidden h-full">
            <div className="p-3 border-b border-[#1C1C1C] flex flex-col justify-center items-center">
              {videoUrl ? (
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-sm font-medium rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-gray-800/40 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6L17.9 19.03A2 2 0 0115.91 21H8.09A2 2 0 016.1 19.03L5 6m5 0V4a2 2 0 012-2h0a2 2 0 012 2v2" />
                  </svg>
                  <span>Delete Movie</span>
                </button>
              ) : (
                <>
                  <label
                    htmlFor="fileInput"
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-sm font-medium rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-red-700/40 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v12"></path>
                      <path d="m17 8-5-5-5 5"></path>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    </svg>
                    <span>Upload</span>
                  </label>
                  <input id="fileInput" type="file" className="hidden" onChange={handleFileUpload} />
                  <p className="text-[11px] text-white/40 mt-2">Max upload size: 2GB</p>
                </>
              )}
            </div>

            {/* MESSAGES */}
            <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-[#1A1A1A] space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                    msg.sender === "me" ? "bg-[#3A3A3A] self-end ml-auto" : "bg-[#202020] self-start"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* INPUT */}
            <div className="p-3 border-t border-[#1C1C1C] flex items-center gap-2">
              <input
                type="text"
                placeholder="Your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded-full bg-[#1C1C1C] text-sm px-4 py-2 text-white/80 focus:outline-none"
              />
              <button onClick={handleSend} className="p-2 hover:bg-[#2A2A2A] rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                  <path d="m21.854 2.147-10.94 10.939"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
