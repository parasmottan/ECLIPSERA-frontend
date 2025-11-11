"use client";
import React, { useState, useEffect } from "react";
import { Cinzel, Inter } from "next/font/google";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["400", "700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "700"] });

function Page() {
  const [name, setName] = useState("");
  const router = useRouter();
  const { roomId } = useParams();

  // ✅ Access Guard (verify localStorage)
  useEffect(() => {
    const verifiedRoom = localStorage.getItem("verifiedRoom");
    if (verifiedRoom !== roomId) {
      alert("⚠️ Please verify room code first!");
      router.push("/"); // redirect back to home/card page
    }
  }, [roomId, router]);

  const handleJoin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`https://eclipsera-backend.onrender.com/api/joinroom/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

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
    <div className="w-full h-screen bg-[#0D0D0E] text-white flex flex-col">
      <div className="w-full h-20 absolute flex justify-between items-center top-0 px-9">
        <h1 className={`text-md text-center cursor-pointer ${cinzel.variable} font-serif`}>
          ECLIPSERA
        </h1>
      </div>

      <div className="w-full h-screen flex justify-center items-center">
        <div className="w-[50%] h-[80%] flex flex-col pt-30 gap-7 items-center">
          <h1 className={`text-4xl text-center font-semibold ${inter.variable}`}>
            Join the Cinema
          </h1>
          <h2 className="text-sm text-white/45 text-center">
            Enter your name to join the room
          </h2>

          <form onSubmit={handleJoin} className="w-[55%] h-[25vh] flex flex-col gap-3">
            <h1 className="font-semibold text-[0.9vw]">Your Name</h1>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-15 px-3 rounded-xl border-none outline-none bg-[#1C1B1C]"
            />
            <button
              type="submit"
              className="w-full mt-3 h-15 px-3 flex justify-center items-center cursor-pointer gap-4 rounded-xl bg-[#E50B16]"
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

          <Link href="/">
            <button className="mt-3 text-sm text-white/45 text-start cursor-pointer mr-[24vw]">
              Back
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Page;
