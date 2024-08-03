"use client"

import { useRouter } from "next/navigation"

export default function DashBoard() { 
  const router = useRouter()

  router.push("/metenox")

  return <></>
}