import React from 'react'
import { Cinzel, Inter } from "next/font/google";
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




function Loading() {
  const [progress, setProgress] = React.useState(0);
  

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prevProgress + 10; // Increment progress by 10% every second
      });
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);
















  return (
    <div className='w-full h-screen bg-[#0D0D0E] flex justify-center items-center'>
      <div className='w-[25%] h-[55%]  flex flex-col justify-center items-center gap-5'>
        <div style={{animationDuration:"8s"}} className='animate-spin border border-gray-400/20 rounded-full h-30 w-30 bg-[#151515] flex justify-center items-center'>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff0000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-film-icon lucide-film w-15 h-15"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>
        </div>
        <h1 className='text-5xl text-white font-bold'>Welcome,Paras</h1>
        <h2 className='text-white/20'>Room: KJAK45KH</h2>
        <h2 className='text-white'>Preparing your cinema...</h2>
        <div className="w-[70%] h-1 bg-gray-800">
  <div
    className="h-1 bg-[#E50B16] transition-all duration-300"
    style={{ width: `${progress}%` }}
  ></div>
</div>
      </div>
    </div>
  )
}

export default Loading