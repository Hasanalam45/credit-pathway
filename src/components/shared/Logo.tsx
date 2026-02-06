import React, { useState } from "react";

const Logo: React.FC<{ large?: boolean }> = ({ large = false }) => {
  const sizeClass = large ? "w-64 h-auto" : "w-36 h-auto";
  const [imageOk, setImageOk] = useState(true);

  // Prefer the provided banner image `paramount-banner.png` in `public/`.
  // Fall back to the existing `logo1.png` and finally to the inline SVG.
  // To display your attached banner, add it to `public/paramount-banner.png`.
  const preferred = "/paramount-banner.png";
  const fallback = "/logo1.png";
  const imgSrc = preferred;

  return (
    <div className={`flex items-center gap-4 ${sizeClass}`}>
      {imageOk ? (
        <img
          src={imgSrc}
          alt="Paramount logo"
          className={`object-contain inline-block ${large ? 'max-h-28' : 'max-h-20'} rounded`}
          onError={(e) => {
            // if preferred failed, try fallback once before showing SVG
            if ((e.currentTarget as HTMLImageElement).src.endsWith(preferred)) {
              (e.currentTarget as HTMLImageElement).src = fallback;
            } else {
              setImageOk(false);
            }
          }}
        />
      ) : (
        <svg
          viewBox="0 0 200 60"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block"
          aria-hidden
        >
          <defs>
            <linearGradient id="g1" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#D4A317" />
              <stop offset="100%" stopColor="#FDE7A7" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="200" height="60" rx="8" fill="transparent" />

        </svg>
      )}


    </div>
  );
};

export default Logo;
