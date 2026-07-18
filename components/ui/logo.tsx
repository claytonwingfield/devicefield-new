import Image from "next/image";

export default function Logo({
  showWordmark = false,
  inverse = false,
}: {
  showWordmark?: boolean;
  inverse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Devicefield">
      <Image
        src="/images/logo1.PNG"
        alt="Devicefield"
        width={42}
        height={42}
        priority
      />
      {showWordmark && (
        <span
          className={`hidden text-lg font-semibold tracking-[-0.03em] sm:inline ${
            inverse ? "text-white" : "text-zinc-950"
          }`}
        >
          Devicefield
        </span>
      )}
    </span>
  );
}
