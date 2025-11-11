"use client";
import React, { useEffect, useState } from "react";
import { Cinzel, Inter } from "next/font/google";
import Link from "next/link";
import { BASE_URL } from "@/utils/api";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "700"],
});

function Page() {
  const [roomCode, setRoomCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [copied, setCopied] = useState(false);

  const createRoomCode = async () => {
    setLoading(true);
    try {
      const res = await BASE_URL.post("/createroom");
      setRoomCode(res.data.roomId);
      console.log("Room code created:", res.data.roomId);
    } catch (error) {
      console.error("Error creating room code:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createRoomCode();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="w-full min-h-screen bg-[#0D0D0E] text-white flex flex-col items-center justify-center px-4">
      {/* 🔝 Navbar */}
      <div className="w-full max-w-[90%] md:max-w-[80%] h-20 flex justify-between items-center top-0 px-2 md:px-9 fixed bg-[#0D0D0E]/80 backdrop-blur-sm z-20 border-b border-white/5">
        <h1
          className={`text-lg md:text-md text-center cursor-pointer ${cinzel.variable} font-serif`}
        >
          ECLIPSERA
        </h1>

        <Link href="/">
          <button className="text-xs sm:text-sm text-white/50 hover:text-white transition">
            Back
          </button>
        </Link>
      </div>

      {/* 🎬 Main Content */}
      <div className="w-full flex flex-col justify-center items-center mt-28 md:mt-0 gap-6 md:gap-8 text-center md:text-left">
        <h1
          className={`text-3xl sm:text-4xl md:text-5xl font-semibold ${inter.variable}`}
        >
          Welcome to Your Cinema
        </h1>
        <h2 className="text-xs sm:text-sm text-white/50">
          Share your room code and enter your name to begin
        </h2>

        {/* 🧾 Room Code Card */}
        <div className="w-full sm:w-[80%] md:w-[55%] rounded-2xl border border-white/10 bg-[#161616] py-5 px-6 flex flex-col gap-3 shadow-lg">
          <h1 className="text-[0.9rem] text-white/45 uppercase tracking-wide">
            Your Room Code
          </h1>
          <div className="w-full flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-2xl font-semibold text-[#E4E4E4] break-all">
              {loading ? "Generating..." : roomCode || "—"}
            </h1>

            {/* 📋 Copy Button */}
            <div
              className="relative w-10 h-10 cursor-pointer bg-[#1B1B1B] rounded-xl flex justify-center items-center active:bg-gray-800 hover:bg-[#222] transition"
              onClick={handleCopy}
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
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
              {copied && (
                <span className="absolute -top-5 text-[10px] text-green-400">
                  Copied!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 🧍‍♂️ User Name Form */}
        <form className="w-full sm:w-[80%] md:w-[55%] flex flex-col gap-4 mt-4">
          <h1 className="font-semibold text-sm sm:text-base text-white/80">
            Your Name
          </h1>

          <input
            type="text"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className="w-full h-12 px-4 rounded-xl border-none outline-none bg-[#1C1B1C] text-white/70 focus:ring-1 focus:ring-red-600 transition"
          />

          <Link
            href={roomCode ? `/room/${roomCode}` : "#"}
            className="w-full flex justify-center"
          >
            <button
              type="submit"
              disabled={!roomCode}
              className={`w-full sm:w-[70%] h-12 mt-3 flex justify-center items-center gap-3 rounded-xl transition ${
                roomCode
                  ? "bg-[#E50B16] hover:bg-[#ff202b]"
                  : "bg-gray-700 cursor-not-allowed"
              }`}
            >
              ENTER CINEMA
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-right text-lg"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          </Link>
        </form>
      </div>

      {/* ✨ Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Page;
