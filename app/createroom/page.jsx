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
    <div className="w-full min-h-screen bg-[#0D0D0E] text-white flex flex-col items-center justify-center px-[clamp(1rem,3vw,5rem)]">
      {/* 🔝 Navbar */}
      <div className="w-full max-w-[90%] md:max-w-[80%] h-[clamp(60px,5vw,90px)] flex justify-between items-center top-0 px-[clamp(1rem,2vw,3rem)] fixed bg-[#0D0D0E]/80 backdrop-blur-sm z-20 border-b border-white/5">
        <h1
          className={`text-[clamp(1rem,1.5vw,1.8rem)] text-center cursor-pointer ${cinzel.variable} font-serif`}
        >
          ECLIPSERA
        </h1>

        <Link href="/">
          <button className="text-[clamp(0.8rem,1vw,1rem)] text-white/60 hover:text-white transition">
            Back
          </button>
        </Link>
      </div>

      {/* 🎬 Main Content */}
      <div className="w-full flex flex-col justify-center items-center mt-[clamp(6rem,10vh,12rem)] gap-[clamp(1.2rem,2vw,2.5rem)] text-center">
        <h1
          className={`font-semibold ${inter.variable} text-[clamp(1.8rem,3vw,4rem)] leading-tight`}
        >
          Welcome to Your Cinema
        </h1>
        <h2 className="text-[clamp(0.8rem,1vw,1rem)] text-white/50">
          Share your room code and enter your name to begin
        </h2>

        {/* 🧾 Room Code Card */}
        <div className="w-full sm:w-[85%] md:w-[60%] lg:w-[45%] 2xl:w-[35%] 4k:w-[30%] rounded-2xl border border-white/10 bg-[#161616] py-[clamp(1.2rem,2vw,2.8rem)] px-[clamp(1rem,2vw,3rem)] flex flex-col gap-[clamp(0.8rem,1.2vw,1.6rem)] shadow-lg animate-fadeIn">
          <h1 className="text-[clamp(0.8rem,1vw,1rem)] text-white/45 uppercase tracking-wide">
            Your Room Code
          </h1>

          <div className="w-full flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-[clamp(1.4rem,2.2vw,2.6rem)] font-semibold text-[#E4E4E4] break-all">
              {loading ? "Generating..." : roomCode || "—"}
            </h1>

            {/* 📋 Copy Button */}
            <div
              className="relative w-[clamp(2.5rem,3vw,3.2rem)] h-[clamp(2.5rem,3vw,3.2rem)] cursor-pointer bg-[#1B1B1B] rounded-xl flex justify-center items-center active:bg-gray-800 hover:bg-[#222] transition"
              onClick={handleCopy}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="clamp(18,1.5vw,22)"
                height="clamp(18,1.5vw,22)"
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
                <span className="absolute -top-5 text-[clamp(10px,0.8vw,12px)] text-green-400">
                  Copied!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 🧍‍♂️ User Name Form */}
        <form className="w-full sm:w-[85%] md:w-[60%] lg:w-[45%] 2xl:w-[35%] 4k:w-[30%] flex flex-col gap-[clamp(1rem,1.5vw,2rem)] mt-[clamp(1.5rem,2vw,2.5rem)]">
          <h1 className="font-semibold text-[clamp(0.9rem,1vw,1.1rem)] text-white/80 text-left">
            Your Name
          </h1>

          <input
            type="text"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className="w-full h-[clamp(2.8rem,3.5vw,3.8rem)] px-4 rounded-xl border-none outline-none bg-[#1C1B1C] text-white/70 focus:ring-1 focus:ring-red-600 transition text-[clamp(0.9rem,1vw,1.1rem)]"
          />

          <Link
            href={roomCode ? `/room/${roomCode}` : "#"}
            className="w-full flex justify-center"
          >
            <button
              type="submit"
              disabled={!roomCode}
              className={`whitespace-nowrap px-5 w-full sm:w-[70%] md:w-[55%] mx-auto h-[clamp(2.8rem,3.5vw,3.8rem)] flex justify-center items-center gap-3 rounded-xl transition text-[clamp(0.9rem,1vw,1.1rem)] font-medium ${
                roomCode
                  ? "bg-[#E50B16] hover:bg-[#ff202b]"
                  : "bg-gray-700 cursor-not-allowed"
              }`}
            >
              ENTER CINEMA
            
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

        @media (min-width: 2560px) {
          /* 4K layout refinement */
          .4k\\:w\\[30\\%\\] {
            width: 30%;
          }
        }
      `}</style>
    </div>
  );
}

export default Page;
