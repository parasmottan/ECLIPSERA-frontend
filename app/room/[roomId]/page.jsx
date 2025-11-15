"use client";
import React, { useState, useEffect } from "react";
import { Cinzel } from "next/font/google";
import NetflixPlayer from "../../components/NetflixPlayer";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function Page({ params }) {
  const realRoomId = params?.roomId
    ? String(params.roomId).toLowerCase().trim()
    : null;

  const router = useRouter();

  const [valid, setValid] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [fileKey, setFileKey] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessages, setStatusMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // POPUP (same)
  const [popup, setPopup] = useState({
    visible: false,
    type: "",
    message: "",
    onConfirm: null,
  });

  // ---------------------------------------------
  // 1️⃣ VERIFY ROOM (stable)
  // ---------------------------------------------
  useEffect(() => {
    if (!realRoomId) return;

    let cancelled = false;

    const verify = async () => {
      try {
        const res = await fetch(
          `https://eclipsera.zeabur.app/api/createroom/${realRoomId}`
        );
        if (cancelled) return;

        const data = await res.json();

        if (data.success === false) {
          setValid(false);
          router.push("/");
          return;
        }

        setValid(true);
      } catch (err) {
        console.log("Room verify error:", err.message);
        setValid(null);
      }
    };

    verify();
    return () => (cancelled = true);
  }, [realRoomId]);

  // ---------------------------------------------
  // 2️⃣ SOCKET CONNECTION + REALTIME VIDEO EVENTS
  // ---------------------------------------------
  useEffect(() => {
    if (valid !== true || !realRoomId) return;

    const newSocket = io("https://eclipsera.zeabur.app", {
      transports: ["websocket"],
      autoConnect: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🔗 Connected to room:", realRoomId);
      newSocket.emit("join_room", realRoomId);
    });

    // 🎥 When server sends existing movie to NEW JOINER
    newSocket.on("video_ready", (hlsUrl) => {
      console.log("🎥 REALTIME: video_ready received:", hlsUrl);
      setVideoUrl(hlsUrl);
    });

    // 🗑 When someone deletes movie
    newSocket.on("video_deleted", () => {
      console.log("🗑 REALTIME: delete received");
      setVideoUrl(null);
      setFileKey(null);
    });

    // 💬 chat messages
    newSocket.on("receive_message", (data) =>
      setMessages((prev) => [...prev, data])
    );

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [valid, realRoomId]);

  // ---------------------------------------------
  // 3️⃣ LOAD EXISTING MOVIE (Frontend refresh / other user join)
  // ---------------------------------------------
  useEffect(() => {
    if (valid !== true || !realRoomId) return;

    const load = async () => {
      try {
        const res = await fetch(
          `https://eclipsera.zeabur.app/api/movieupload/${realRoomId}`
        );
        const data = await res.json();

        if (data.success && data.video?.hlsUrl) {
          console.log("🎬 Existing video loaded:", data.video.hlsUrl);
          setVideoUrl(data.video.hlsUrl);
          setFileKey(data.video.fileKey);
        }
      } catch (err) {
        console.error("Loading existing movie failed:", err.message);
      }
    };

    load();
  }, [valid, realRoomId]);

  // ---------------------------------------------
  // 4️⃣ SEND CHAT
  // ---------------------------------------------
  const handleSend = () => {
    if (!socket || !input.trim()) return;

    const msg = { text: input, sender: "me" };
    setMessages((p) => [...p, msg]);

    socket.emit("send_message", {
      roomId: realRoomId,
      text: input,
      sender: "user",
    });

    setInput("");
  };

  const handleKeyDown = (e) => e.key === "Enter" && handleSend();

  // ---------------------------------------------
  // 5️⃣ UPLOAD + CONVERSION + REALTIME BROADCAST
  // ---------------------------------------------
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
      setStatusMessages(["🚀 Uploading…", "Please wait"]);

      const res = await fetch("https://eclipsera.zeabur.app/api/upload-url");
      const { uploadURL, fileKey: key } = await res.json();

      setFileKey(key);

      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      setStatusMessages((p) => [...p, "🎬 Converting…"]);

      const movieUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;

      const convert = await fetch(
        "https://eclipsera.zeabur.app/api/movieupload/process",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieUrl, roomId: realRoomId }),
        }
      );

      const data = await convert.json();

      if (data.success) {
        setVideoUrl(data.hlsUrl);
        setStatusMessages((p) => [...p, "🍿 Ready"]);

        // ⭐ BROADCAST TO OTHERS USING SOCKET
        socket.emit("video_ready", {
          roomId: realRoomId,
          hlsUrl: data.hlsUrl,
        });
      } else {
        setStatusMessages((p) => [...p, "❌ Conversion failed"]);
      }
    } catch (err) {
      console.error("Upload/convert error:", err.message);
      setStatusMessages(["💥 Failed"]);
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------
  // 6️⃣ DELETE MOVIE (Realtime)
  // ---------------------------------------------
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

          // ⭐ INFORM OTHER USERS
          socket.emit("video_deleted", { roomId: realRoomId });
        }
      },
    });
  };

  // ---------------------------------------------
  // STATUS UI
  // ---------------------------------------------
  if (valid === null)
    return <p className="text-white text-center mt-10">Checking room…</p>;
  if (valid === false) return null;

  // ---------------------------------------------
  // UI (same)
  // ---------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#0D0D0E] text-white flex flex-col">
      {/* TOP BAR */}
      <div className="w-full h-[4rem] flex justify-between items-center px-[3vw] bg-[#0D0D0E]/90 border-b border-white/5 backdrop-blur-md">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        >
          <svg width="20" height="20" stroke="#E5E5E5" strokeWidth="2">
            <path d="m12 19-7-7 7-7"></path>
            <path d="M19 12H5"></path>
          </svg>
          <h1>Leave</h1>
        </div>

        <h1 className={`font-bold ${cinzel.variable}`}>ECLIPSERA</h1>

        <div className="px-3 py-1 bg-[#1A1A1A] rounded-full">
          Room: {realRoomId}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-col lg:flex-row w-full flex-1 p-[2vw] gap-[2vw]">
        {/* PLAYER */}
        <div className="w-full lg:w-[70%] bg-[#101010] rounded-2xl p-[3px] shadow-lg relative">
          <NetflixPlayer src={videoUrl} roomId={realRoomId} />

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
          {/* Upload/Delete */}
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
                  accept="video/*"
                  onChange={handleFileUpload}
                />
              </>
            )}
          </div>

          {/* CHAT */}
          <div className="flex-1 mt-3 space-y-2 overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`px-4 py-2 rounded-xl ${
                  msg.sender === "me" ? "bg-[#3A3A3A] ml-auto" : "bg-[#202020]"
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
