import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex" aria-label="Cruip">
      <Image
        src="/images/logo1.png"
        alt="Logo"
        width={42}
        height={42}
        priority
      />
    </Link>
  );
}
