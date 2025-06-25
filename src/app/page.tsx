"use client";
import React from 'react'
import { inter, urbanist } from './utils/fonts'
import "./globals.css";
import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link';

const page = () => {
  return (
    <div className={`bg-black-100 text-white min-h-screen flex flex-col justify-center items-center ${inter.className}`}>
      <div className={`uppercase tracking-widest font-light text-[#E4ECFF] mb-5`}>
        Creating Dynamic Web Magic
      </div>
      <div className={`font-bold text-3xl leading-9 w-[500px] mb-4 text-balance text-center tracking-wider ${urbanist.className}`}>
        Hello there, I am Arnav Raj-<span className='text-[#CBACF9]'>
          FULL STACK
        </span> Web Developer
        Creating Innovative Web Experiences
      </div>
      <div className='text-[#E4ECFF] font-light tracking-wider mb-5'>
        Providing Seamless User Experience • Based in Uttarakhand, India
      </div>
      <Link href={"#"}>
        <motion.button 
          className='animate-border-rotation rounded-lg border-2 border-transparent bg-gradient-to-br from-[#161A31] to-[#06091F] p-4 h-10 flex justify-center items-center text-sm relative overflow-hidden hover:animation-play-state-running'
          style={{
            background: `
              linear-gradient(to bottom, #161A31, #06091F) padding-box,
              conic-gradient(from var(--bg-angle), #CBACF9, #161A31, #CBACF9, #06091F, #CBACF9) border-box
            `
          }}
        >
          See my work 
          <span className='ml-1'>
            <ArrowUpRight size={16} />
          </span>
        </motion.button>
      </Link>
    </div>
  )
}

export default page