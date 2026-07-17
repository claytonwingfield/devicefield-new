import Image from "next/image";

export default function Logo() {
  return (
    <span className="inline-flex" aria-label="Devicefield">
      <Image
        src="/images/logo1.PNG"
        alt="Devicefield"
        width={42}
        height={42}
        priority
      />
    </span>
  );
}
