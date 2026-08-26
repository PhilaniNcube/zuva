import { Suspense } from "react";
import Image from "next/image";

import { LoginForm } from "@/features/user/components/login-form";
import desktopBg from "@/public/images/desktop_background.jpg";
import mobileBg from "@/public/images/mobile_background.jpg";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Full page background images — mobile vs desktop */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f7ebd4]">
        <Image
          src={mobileBg}
          alt=""
          aria-hidden
          fill
          priority
          placeholder="blur"
          className="object-cover object-bottom md:hidden"
        />
        <Image
          src={desktopBg}
          alt="ZUVA Scholar Hub Background"
          fill
          priority
          placeholder="blur"
          className="hidden object-cover object-bottom md:block"
        />
      </div>

      <div className="w-full max-w-sm">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
