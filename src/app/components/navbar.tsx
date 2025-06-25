import Link from 'next/link'
import React from 'react'

const navbar = () => {
  return (
    <nav className='sticky top-12 z-50 mx-auto w-[400px] bg-gradient-to-bl from-[#04071D] to-[#0C0E23] h-20  flex justify-center items-center text-[#FFFFFF] font-light gap-x-4 border-2 border-[#6971A229] rounded-xl'>
        <Link href={"#"}>
        <div>About</div>
        </Link>
        <Link href={"#"}>
        <div>Projects</div>
        </Link>
        <Link href={"#"}>
        <div>Resume</div>
        </Link>
        <Link href={"#"}>
        <div>Contract</div>
        </Link>
      
    </nav>
  )
}

export default navbar