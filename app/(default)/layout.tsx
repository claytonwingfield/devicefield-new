"use client";

import { useEffect } from "react";

import "aos/dist/aos.css";

import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    void import("aos").then((mod) => {
      mod.default.init({
        duration: 500,
        easing: "ease",
      });
    });
  }, []);

  return (
    <>
      <Header />

      <main className="grow">{children}</main>
      <Footer border={true} />
    </>
  );
}
