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
  const [popup, setPopup] = useState({
    visible: false,
    type: "",
    message: "",
    onConfirm: null,
  });
  const router = useRouter();

  // ✅ Verify Room
  useEffect(() => {
    const verifyRoom = async () => {
      try {
        const res = await axios.get(
          `https://eclipsera-backend.zeabur.internal/api/createroom/${roomId}`
        );
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
    const newSocket = io("https://eclipsera-backend.zeabur.internal");
    setSocket(newSocket);
    newSocket.emit("join_room", roomId);
    newSocket.on("receive_message", (data) =>
      setMessages((p) => [...p, data])
    );
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

  // 🧠 Fetch existing movie
  useEffect(() => {
    if (!valid || !roomId) return;
    const fetchRoomVideo = async () => {
      try {
        const res = await fetch(
          `https://eclipsera-backend.zeabur.internal/api/movieupload/${roomId}`
        );
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

  // ✅ File Upload + Conversion Handler (3GB limit)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB
    if (file.size > maxSize) {
      setPopup({
        visible: true,
        type: "warning",
        message:
          "🚫 File too large! Please upload a movie under 3GB to ensure smooth processing.",
        onConfirm: () => setPopup({ visible: false }),
      });
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setStatusMessages([
        "🚀 Upload started...",
        "Please don’t refresh this page!",
      ]);

      const res = await fetch(
        "https://eclipsera-backend.zeabur.internal/api/upload-url"
      );
      const { uploadURL, fileKey } = await res.json();
      setFileKey(fileKey);

      setStatusMessages((p) => [...p, "📤 Uploading movie to cloud..."]);

      const start = Date.now();
      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: file,
      });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      setStatusMessages((p) => [
        ...p,
        `✅ Upload completed in ${elapsed}s`,
        "🎬 Starting conversion...",
      ]);

      const movieUrl = `https://s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_AWS_BUCKET}/${fileKey}`;
      const convertRes = await fetch(
        "https://eclipsera-backend.zeabur.internal/api/movieupload/process",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieUrl, roomId }),
        }
      );

      setStatusMessages((p) => [
        ...p,
        "⚙️ Processing your movie, please wait...",
      ]);

      const data = await convertRes.json();
      if (data.success) {
        setStatusMessages((p) => [
          ...p,
          "✅ Conversion completed!",
          "🍿 Movie is ready to stream!",
        ]);
        setVideoUrl(data.hlsUrl);
      } else {
        setStatusMessages((p) => [
          ...p,
          "❌ Conversion failed, please try again.",
        ]);
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
          const res = await fetch(
            "https://eclipsera-backend.zeabur.internal/api/movieupload/delete",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileKey }),
            }
          );
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

  if (valid === null)
    return <p className="text-white text-center mt-10">Checking room...</p>;
  if (!valid) return null;

  return (
    <div
      className="w-full min-h-screen bg-[#0D0D0E] text-white flex flex-col overflow-hidden relative"
      style={{ fontSize: "clamp(14px, 0.9vw, 18px)" }}
    >
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
      <div
        className="w-full h-[4rem] flex justify-between items-center px-[3vw] bg-[#0D0D0E]/90 border-b border-white/5 backdrop-blur-md z-40"
        style={{ fontSize: "clamp(12px, 0.8vw, 16px)" }}
      >
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          onClick={() => router.push("/")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E5E5E5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7"></path>
            <path d="M19 12H5"></path>
          </svg>
          <h1>Leave</h1>
        </div>

        <h1
          className={`font-bold ${cinzel.variable}`}
          style={{ fontSize: "clamp(16px, 1vw, 24px)" }}
        >
          ECLIPSERA
        </h1>

        <div
          className="px-3 py-1 bg-[#1A1A1A] rounded-full"
          style={{ fontSize: "clamp(10px, 0.7vw, 14px)" }}
        >
          Room: {roomId}
        </div>
      </div>

      {/* ⚡ MAIN SECTION */}
      <div className="flex flex-col lg:flex-row w-full flex-1 mt-2 md:mt-4 p-[2vw] gap-[2vw] h-[calc(100vh-56px)] overflow-hidden">
        {/* 🎬 PLAYER */}
        <div className="w-full lg:w-[70%] bg-[#101010] rounded-2xl p-[3px] shadow-lg flex items-center justify-center relative aspect-video max-h-[90vh]">
          <div className="w-full h-full rounded-xl overflow-hidden">
            <NetflixPlayer src={videoUrl} roomId={roomId} />
          </div>

          {/* Uploading Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center text-center p-4 sm:p-6 md:p-8 overflow-hidden z-50">
              <div className="flex flex-col items-center w-[90%] sm:w-[80%] md:w-[70%] lg:w-[60%] xl:w-[40%] max-w-[600px]">
                <h1
                  className="font-semibold text-white/90 mb-3 sm:mb-4"
                  style={{ fontSize: "clamp(14px, 2.5vw, 20px)" }}
                >
                  🎥 Uploading & Processing
                </h1>

                <div className="flex flex-col gap-1 sm:gap-2 w-full">
                  {statusMessages.map((msg, i) => (
                    <p
                      key={i}
                      className="text-white/70 animate-pulse leading-snug break-words"
                      style={{
                        fontSize: "clamp(12px, 2vw, 16px)",
                        animationDelay: `${i * 0.3}s`,
                      }}
                    >
                      {msg}
                    </p>
                  ))}
                </div>

                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin mt-5 sm:mt-6"></div>
              </div>
            </div>
          )}
        </div>

        {/* 💬 CHAT PANEL */}
        <div
          className="w-full lg:w-[30%] flex flex-col bg-[#151515] rounded-2xl shadow-lg overflow-hidden max-h-[90vh]"
          style={{ fontSize: "clamp(13px, 0.9vw, 16px)" }}
        >
          <div className="bg-[#151515] rounded-xl flex flex-col justify-between overflow-hidden h-full">
            {/* Upload/Delete */}
            <div className="p-3 border-b border-[#1C1C1C] flex flex-col justify-center items-center">
              {videoUrl ? (
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-sm font-medium rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-gray-800/40 transition-all"
                >
                  🗑️ Delete Movie
                </button>
              ) : (
                <>
                  <label
                    htmlFor="fileInput"
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-sm font-medium rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-red-700/40 transition-all"
                  >
                    ⬆️ Upload
                  </label>
                  <input
                    id="fileInput"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <p className="text-[11px] text-white/40 mt-2">
                    Max upload size: 3GB
                  </p>
                </>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-[#1A1A1A] space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    msg.sender === "me"
                      ? "bg-[#3A3A3A] self-end ml-auto"
                      : "bg-[#202020] self-start"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-[#1C1C1C] flex items-center gap-2">
              <input
                type="text"
                placeholder="Your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded-full bg-[#1C1C1C] text-sm px-4 py-2 text-white/80 focus:outline-none"
              />
              <button
                onClick={handleSend}
                className="p-2 hover:bg-[#2A2A2A] rounded-full transition"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
