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

  // -------------------------------------
  // 1️⃣ VERIFY ROOM (CORRECT ENDPOINT)
  // -------------------------------------
  useEffect(() => {
    if (!roomId) return;

    const verifyRoom = async () => {
      try {
        const res = await fetch(
          `https://veloura.zeabur.app/api/verifyroom/${roomId}`,
          {
            method: "GET",
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          }
        );

        if (res.status === 404) {
          alert("❌ Invalid Room Code!");
          router.push("/");
          return;
        }

        if (res.status === 200) {
          localStorage.setItem("verifiedRoom", roomId);
          return;
        }

        alert("⚠️ Server error. Try again.");
        router.push("/");
      } catch (err) {
        console.log("Verify error:", err.message);
        router.push("/");
      }
    };

    verifyRoom();
  }, [roomId, router]);

  // -------------------------------------
  // 2️⃣ JOIN ROOM
  // -------------------------------------
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter your name!");

    try {
      const res = await fetch(
        `https://veloura.zeabur.app/api/joinroom/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        router.push(`/cinema/${roomId}`);
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error("Join error:", error);
      alert("Server error, try again.");
    }
  };

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#0D0D0E] text-white flex flex-col items-center justify-center px-[clamp(1rem,3vw,4rem)]">

      <div className="w-full max-w-[90%] md:max-w-[80%] h-[clamp(60px,5vw,90px)] flex justify-between items-center fixed top-0 px-[clamp(1rem,2.5vw,3rem)] bg-[#0D0D0E]/80 backdrop-blur-sm z-20 border-b border-white/5">
        <h1 className={`${cinzel.variable} text-[clamp(1rem,1.5vw,1.8rem)] cursor-pointer`}>
          VELOURA
        </h1>
        <Link href="/">
          <button className="text-white/60 hover:text-white transition">Back</button>
        </Link>
      </div>

      <div className="flex flex-col justify-center items-center text-center mt-[clamp(6rem,10vh,12rem)] gap-[clamp(1rem,2vw,2.5rem)] w-full animate-fadeIn">
        <h1 className={`${inter.variable} text-[clamp(1.8rem,3vw,4rem)] font-semibold`}>
          Join the Cinema
        </h1>
        <h2 className="text-white/50 text-[clamp(0.8rem,1vw,1rem)]">
          Enter your name to join the room
        </h2>

        <form
          onSubmit={handleJoin}
          className="w-full sm:w-[85%] md:w-[60%] lg:w-[45%] 2xl:w-[35%] bg-[#161616] border border-white/10 rounded-2xl px-[clamp(1.2rem,2vw,2.5rem)] py-[clamp(1.5rem,2.5vw,3rem)] shadow-lg flex flex-col gap-[clamp(1rem,1.5vw,1.8rem)]"
        >
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-[clamp(2.8rem,3.5vw,3.8rem)] px-4 rounded-xl bg-[#1C1B1C] text-white/70 outline-none focus:ring-1 focus:ring-red-600 transition"
          />

          <button
            type="submit"
            className="w-full sm:w-[70%] md:w-[50%] mx-auto h-[clamp(2.8rem,3.5vw,3.8rem)] flex justify-center items-center rounded-xl bg-[#E50B16] hover:bg-[#ff202b] transition shadow-md text-[clamp(0.9rem,1vw,1.1rem)] font-medium"
          >
            ENTER CINEMA →
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-in-out forwards; }
      `}</style>
    </div>
  );
}

export default Page;
