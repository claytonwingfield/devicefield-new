type SocialProfile = {
  href: string;
  label: string;
};

export default function SocialLinks({
  profiles,
  inverse = false,
  large = false,
}: {
  profiles: SocialProfile[];
  inverse?: boolean;
  large?: boolean;
}) {
  return (
    <ul className={`flex flex-wrap ${large ? "gap-3" : "gap-2"}`}>
      {profiles.map((profile) => (
        <li key={profile.href}>
          <a
            href={profile.href}
            target="_blank"
            rel="me noopener noreferrer"
            className={`inline-flex items-center rounded-full border font-semibold transition ${
              large ? "gap-3 px-5 py-3 text-sm" : "gap-2 px-3 py-2 text-xs"
            } ${
              inverse
                ? "border-white/15 bg-white/[0.06] text-zinc-200 hover:border-lime-300 hover:text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
            }`}
            aria-label={`Follow Devicefield on ${profile.label}`}
          >
            {profile.label}
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="size-3.5"
            >
              <path
                d="M5 11 11 5m0 0H6.5M11 5v4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
