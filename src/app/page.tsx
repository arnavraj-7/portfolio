"use client";
import React from 'react'
import { inter, urbanist } from '../utils/fonts'
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
          className='animated-border'
        >
          <div className='content'>
          See my work 
          <span className='ml-1'>
            <ArrowUpRight size={16} />
          </span>
          </div>
        </motion.button>
      </Link>
    </div>
  )
}

export default page