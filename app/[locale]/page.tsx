"use client"

import { useRouter } from "@/i18n/routing";
import Image from "next/image";

export default function Home() {
  const router = useRouter()

  router.push('/metenox')

  return (
    <div></div>
  );
}
