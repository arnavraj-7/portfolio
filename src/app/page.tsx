import React from 'react'
import { inter } from './utils/fonts'
import "./globals.css";
const page = () => {
  return (
    <div className={`bg-black-100 text-white min-h-screen flex flex-col justify-center items-center ${inter.className}`}>
      <div className={`uppercase font-light text-[#E4ECFF] ${inter.className}`}>
        Dynamic Web Magic
      </div>
      <div className='font-bold text-2xl md:text-3xl text-balance'>
        Hello there,I am Arnav Raj-<span className='text-[#CBACF9]'>
          FULL STACK
          </span> Web Developer
      </div>
      <div className='text-[#E4ECFF] font-light'>
        Providing Seamless User Experience • Based in Uttrakhand,India
      </div>
    </div>
  )
}

export default page