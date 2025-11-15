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
        `https://eclipsera-backend.zeabur.internal/api/joinroom/${roomId}`,
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
    <div className="w-full min-h-screen bg-[#0D0D0E] text-white flex flex-col items-center justify-center px-[clamp(1rem,3vw,4rem)]">
      {/* 🔝 Navbar */}
      <div className="w-full max-w-[90%] md:max-w-[80%] h-[clamp(60px,5vw,90px)] flex justify-between items-center fixed top-0 px-[clamp(1rem,2.5vw,3rem)] bg-[#0D0D0E]/80 backdrop-blur-sm z-20 border-b border-white/5">
        <h1
          className={`text-[clamp(1rem,1.5vw,1.8rem)] cursor-pointer ${cinzel.variable} font-serif`}
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
      <div className="flex flex-col justify-center items-center text-center mt-[clamp(6rem,10vh,12rem)] gap-[clamp(1rem,2vw,2.5rem)] w-full animate-fadeIn">
        <h1
          className={`font-semibold ${inter.variable} text-[clamp(1.8rem,3vw,4rem)] leading-tight`}
        >
          Join the Cinema
        </h1>
        <h2 className="text-[clamp(0.8rem,1vw,1rem)] text-white/50">
          Enter your name to join the room
        </h2>

        {/* 🧾 Form Card */}
        <form
          onSubmit={handleJoin}
          className="w-full sm:w-[85%] md:w-[60%] lg:w-[45%] 2xl:w-[35%] 4k:w-[30%] bg-[#161616] border border-white/10 rounded-2xl px-[clamp(1.2rem,2vw,2.5rem)] py-[clamp(1.5rem,2.5vw,3rem)] shadow-lg flex flex-col gap-[clamp(1rem,1.5vw,1.8rem)]"
        >
          <h1 className="font-semibold text-[clamp(0.9rem,1vw,1.2rem)] text-white/80 text-left">
            Your Name
          </h1>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-[clamp(2.8rem,3.5vw,3.8rem)] px-4 rounded-xl border-none outline-none bg-[#1C1B1C] text-white/70 focus:ring-1 focus:ring-red-600 transition text-[clamp(0.9rem,1vw,1.1rem)]"
          />

          <button
            type="submit"
            className="w-full sm:w-[70%] md:w-[50%] mx-auto h-[clamp(2.8rem,3.5vw,3.8rem)] flex justify-center items-center gap-3 rounded-xl bg-[#E50B16] hover:bg-[#ff202b] transition shadow-md hover:shadow-lg text-[clamp(0.9rem,1vw,1.1rem)] font-medium"
          >
            ENTER CINEMA{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="clamp(16,1.5vw,20)"
              height="clamp(16,1.5vw,20)"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-right"
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
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-in-out forwards;
        }

        @media (min-width: 2560px) {
          /* 🎬 4K / TV Optimization */
          .4k\\:w\\[30\\%\\] {
            width: 30%;
          }
        }
      `}</style>
    </div>
  );
}

export default Page;
