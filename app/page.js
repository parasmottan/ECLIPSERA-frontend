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
    if (e.target.id === "overlay") {
      setShowJoinCard(false);
    }
  };

 const handleJoinRoom = (e) => {
  e.preventDefault();

  if (!roomCode.trim()) {
    alert("Please enter a room code!");
    return;
  }

  // ✅ Step 1: Save verified room first
  localStorage.setItem("verifiedRoom", roomCode);

  // ✅ Step 2: Then navigate to correct route
  router.push(`/room/${roomCode}`);
};


  return (
    <div className="relative w-full h-screen bg-[#0D0D0E] text-white overflow-hidden">
      {/* 🟢 Navbar */}
      <div className="w-full h-20 absolute flex justify-between items-center top-0 px-9 z-20">
        <h1 className={`text-md text-center cursor-pointer ${cinzel.variable} font-serif`}>
          ECLIPSERA
        </h1>

        <button className="moon-btn" aria-label="Toggle theme">
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
            className="moon-icon"
            aria-hidden="true"
            opacity="0.9"
          >
            <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path>
          </svg>
        </button>
      </div>

      {/* 🟢 Main section */}
      <div
        className={`w-full h-screen flex flex-col items-center justify-center transition-all duration-500 ${
          showJoinCard ? "opacity-40 blur-sm" : "opacity-100 blur-0"
        }`}
      >
        <h1 className={`text-7xl font-semibold ${inter.variable}`}>
          Stream Together. Feel Together.
        </h1>

        <div className="w-full flex justify-center gap-10 items-center mt-10">
          <Link href="/createroom">
            <button className="px-9 cursor-pointer py-3 rounded-xl bg-[#131313] hover:bg-[#252525] transition">
              CREATE A ROOM
            </button>
          </Link>

          <button
            onClick={() => setShowJoinCard(true)}
            className="px-9 cursor-pointer py-3 rounded-xl bg-[#131313] hover:bg-[#252525] transition"
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
            className="w-[30vw] h-[15vw] bg-[#141414] rounded-xl flex flex-col justify-center items-center text-white animate-fadeIn"
          >
            <h1 className="text-2xl font-semibold mb-2">Join Room</h1>

            <form
              onSubmit={handleJoinRoom}
              className="w-full flex flex-col justify-center items-center"
            >
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-[25vw] h-12 bg-[#1A1A1A] rounded-lg mt-4 px-4 text-white/50 focus:outline-none"
              />

              <button
                type="submit"
                className="w-[25vw] h-10 bg-[#E50B16] rounded-lg mt-4 cursor-pointer"
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
