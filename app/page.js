"use client";
import { useState } from "react";
import { Cinzel, Inter } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function Home() {
  const [showJoinCard, setShowJoinCard] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const handleBackgroundClick = (e) => {
    if (e.target.id === "overlay") setShowJoinCard(false);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      alert("Please enter a room code!");
      return;
    }
    localStorage.setItem("verifiedRoom", roomCode);
    router.push(`/room/${roomCode}`);
  };

  return (
    <div className="relative w-full h-screen bg-[#0D0D0E] text-white overflow-hidden flex flex-col">
      {/* 🟢 Navbar */}
      <div className="w-full h-20 absolute flex justify-between items-center top-0 px-6 md:px-9 z-20">
        <h1
          className={`text-lg md:text-xl tracking-wide ${cinzel.variable} font-serif cursor-pointer`}
        >
          ECLIPSERA
        </h1>

        <button className="moon-btn" aria-label="Toggle theme">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E5E5E5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="moon-icon"
            aria-hidden="true"
            opacity="0.9"
          >
            <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path>
          </svg>
        </button>
      </div>

      {/* 🟢 Hero Section */}
      <div
        className={`w-full h-screen flex flex-col items-center justify-center text-center transition-all duration-500 px-4 ${
          showJoinCard ? "opacity-40 blur-sm" : "opacity-100 blur-0"
        }`}
      >
        <h1
          className={`font-semibold ${inter.variable} leading-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-[95%]`}
        >
          Stream Together. <br className="sm:hidden" />
          Feel Together.
        </h1>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mt-10">
          <Link href="/createroom">
            <button className="px-8 sm:px-9 py-3 text-sm sm:text-base rounded-xl bg-[#131313] hover:bg-[#252525] transition cursor-pointer w-[70vw] sm:w-auto">
              CREATE A ROOM
            </button>
          </Link>

          <button
            onClick={() => setShowJoinCard(true)}
            className="px-8 sm:px-9 py-3 text-sm sm:text-base rounded-xl bg-[#131313] hover:bg-[#252525] transition cursor-pointer w-[70vw] sm:w-auto"
          >
            JOIN A ROOM
          </button>
        </div>
      </div>

      {/* 🔴 Join Room Card */}
      {showJoinCard && (
        <div
          id="overlay"
          onClick={handleBackgroundClick}
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] rounded-xl flex flex-col justify-center items-center text-white animate-fadeIn p-6 sm:p-8 w-[90%] sm:w-[70%] md:w-[40%] lg:w-[30vw] max-w-[420px]"
          >
            <h1 className="text-xl sm:text-2xl font-semibold mb-3">
              Join Room
            </h1>

            <form
              onSubmit={handleJoinRoom}
              className="w-full flex flex-col justify-center items-center"
            >
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full sm:w-[80%] h-11 sm:h-12 bg-[#1A1A1A] rounded-lg mt-2 px-4 text-white/70 focus:outline-none focus:ring-1 focus:ring-red-600 transition"
              />

              <button
                type="submit"
                className="w-full sm:w-[80%] h-10 sm:h-11 bg-[#E50B16] rounded-lg mt-4 hover:bg-[#ff202b] transition"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
