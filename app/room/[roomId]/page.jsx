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
  // ✅ Always normalize roomId
  const safeRoomId = params.roomId.toLowerCase().trim();

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
          `https://eclipsera.zeabur.app/api/createroom/${safeRoomId}`
        );

        if (res.status === 200) setValid(true);
        else {
          setValid(false);
          router.push("/");
        }
      } catch {
        setValid(false);
        router.push("/");
      }
    };

    verifyRoom();
  }, [safeRoomId, router]);

  // ✅ Socket Setup
  useEffect(() => {
    if (valid !== true) return;

    const newSocket = io("https://eclipsera.zeabur.app", {
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join_room", safeRoomId);
    });

    newSocket.on("receive_message", (data) =>
      setMessages((p) => [...p, data])
    );

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [valid, safeRoomId]);

  // Send message
  const handleSend = () => {
    if (!input.trim() || !socket) return;

    const msg = { text: input, sender: "me" };
    setMessages((p) => [...p, msg]);

    socket.emit("send_message", {
      roomId: safeRoomId,
      text: input,
      sender: "user",
    });

    setInput("");
  };

  // Enter key send
  const handleKeyDown = (e) => e.key === "Enter" && handleSend();

  // 🧠 Fetch existing movie
  useEffect(() => {
    if (!valid) return;

    const fetchVideo = async () => {
      try {
        const res = await fetch(
          `https://eclipsera.zeabur.app/api/movieupload/${safeRoomId}`
        );

        const data = await res.json();

        if (data.success && data.video?.hlsUrl) {
          setVideoUrl(data.video.hlsUrl);
          setFileKey(data.video.fileKey);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchVideo();
  }, [valid, safeRoomId]);

  // Upload + Convert
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (videoUrl) {
      setPopup({
        visible: true,
        type: "warning",
        message: "A movie already exists. Delete it first.",
        onConfirm: () => setPopup({ visible: false }),
      });
      return;
    }

    try {
      setUploading(true);
      setStatusMessages(["🚀 Upload started...", "Don’t refresh"]);

      const res = await fetch("https://eclipsera.zeabur.app/api/upload-url");
      const { uploadURL, fileKey: key } = await res.json();

      setFileKey(key);

      // Upload file
      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      setStatusMessages((p) => [...p, "🎬 Converting..."]);

      // 👇 FIXED TLS-SAFE URL FORMAT
      const movieUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;

      // Convert
      const cr = await fetch(
        "https://eclipsera.zeabur.app/api/movieupload/process",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieUrl, roomId: safeRoomId }),
        }
      );

      const data = await cr.json();

      if (data.success) {
        setVideoUrl(data.hlsUrl);
        setStatusMessages((p) => [...p, "🍿 Ready to watch"]);
      } else {
        setStatusMessages((p) => [...p, "❌ Conversion failed"]);
      }
    } catch (err) {
      console.error(err);
      setStatusMessages(["💥 Upload failed"]);
    } finally {
      setUploading(false);
    }
  };

  // Delete movie
  const handleDelete = () => {
    setPopup({
      visible: true,
      type: "confirm",
      message: "Delete movie permanently?",
      onConfirm: async () => {
        setPopup({ visible: false });

        const res = await fetch(
          "https://eclipsera.zeabur.app/api/movieupload/delete",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey }),
          }
        );

        const data = await res.json();

        if (data.success) {
          setVideoUrl(null);
          setFileKey(null);
        }
      },
    });
  };

  // ---- UI BELOW (unchanged)
  // Keeping UI untouched so nothing breaks visually

  if (valid === null)
    return <p className="text-white text-center mt-10">Checking room…</p>;
  if (!valid) return null;

  return (
   <div className="w-full min-h-screen bg-[#0D0D0E] text-white flex flex-col">

      {/* TOP BAR */}
      <div className="w-full h-[4rem] flex justify-between items-center px-[3vw] bg-[#0D0D0E]/90 border-b border-white/5 backdrop-blur-md">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            stroke="#E5E5E5"
            strokeWidth="2"
          >
            <path d="m12 19-7-7 7-7"></path>
            <path d="M19 12H5"></path>
          </svg>
          <h1>Leave</h1>
        </div>

        <h1 className={`font-bold ${cinzel.variable}`}>ECLIPSERA</h1>

        <div className="px-3 py-1 bg-[#1A1A1A] rounded-full">
          Room: {safeRoomId}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex flex-col lg:flex-row w-full flex-1 p-[2vw] gap-[2vw]">
        {/* PLAYER */}
        <div className="w-full lg:w-[70%] bg-[#101010] rounded-2xl p-[3px] shadow-lg relative">
          <NetflixPlayer src={videoUrl} roomId={safeRoomId} />

          {uploading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
              {statusMessages.map((msg, i) => (
                <p key={i} className="text-white/80">{msg}</p>
              ))}
            </div>
          )}
        </div>

        {/* CHAT + UPLOAD */}
        <div className="w-full lg:w-[30%] bg-[#151515] rounded-2xl p-3 flex flex-col">
          {/* Upload / Delete */}
          <div className="p-3 border-b border-[#1C1C1C] flex flex-col items-center">
            {videoUrl ? (
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-gray-600 rounded-full"
              >
                🗑️ Delete Movie
              </button>
            ) : (
              <>
                <label
                  htmlFor="fileInput"
                  className="px-6 py-2 bg-red-600 rounded-full cursor-pointer"
                >
                  ⬆️ Upload
                </label>
                <input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 mt-3 space-y-2 overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`px-4 py-2 rounded-xl ${
                  msg.sender === "me"
                    ? "bg-[#3A3A3A] ml-auto"
                    : "bg-[#202020]"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-2 mt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2 rounded-full bg-[#1C1C1C]"
              placeholder="Message..."
            />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}
