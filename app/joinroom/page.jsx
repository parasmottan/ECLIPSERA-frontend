"use client";
import React, { useState, useEffect } from "react";
import { Cinzel, Inter } from "next/font/google";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  const [name, setName] = useState("");
  const router = useRouter();
  const { roomId } = useParams();

  // ✅ Verify access from localStorage
  useEffect(() => {
    const verifiedRoom = localStorage.getItem("verifiedRoom");
    if (verifiedRoom !== roomId) {
      alert("⚠️ Please verify room code first!");
      router.push("/");
    }
  }, [roomId, router]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter your name!");

    try {
      const res = await fetch(
        `https://eclipsera-backend.onrender.com/api/joinroom/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("✅ Joined room successfully!");
        router.push(`/cinema/${roomId}`);
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error("Join error:", error);
      alert("Server error, try again.");
    }
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
      <div className="flex flex-col justify-center items-center text-center mt-24 sm:mt-20 md:mt-0 gap-6 md:gap-8 w-full">
        <h1
          className={`text-3xl sm:text-4xl md:text-5xl font-semibold ${inter.variable}`}
        >
          Join the Cinema
        </h1>
        <h2 className="text-xs sm:text-sm text-white/50">
          Enter your name to join the room
        </h2>

        {/* 🧾 Name Form */}
        <form
          onSubmit={handleJoin}
          className="w-full sm:w-[80%] md:w-[55%] flex flex-col gap-4 mt-6 bg-[#161616] border border-white/10 rounded-2xl px-5 sm:px-8 py-8 shadow-lg"
        >
          <h1 className="font-semibold text-sm sm:text-base text-left text-white/80">
            Your Name
          </h1>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-none outline-none bg-[#1C1B1C] text-white/70 focus:ring-1 focus:ring-red-600 transition"
          />

          <button
            type="submit"
            className="w-full sm:w-[70%] md:w-[50%] mx-auto h-12 mt-4 flex justify-center items-center gap-3 rounded-xl bg-[#E50B16] hover:bg-[#ff202b] transition shadow-md hover:shadow-lg"
          >
            ENTER CINEMA{" "}
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
        </form>
      </div>

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
