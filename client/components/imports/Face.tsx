import svgPaths from "./svg-83u54y3liz";

export default function Face() {
  return (
    <div className="relative size-full" data-name="face">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 56 56">
        <g clipPath="url(#clip0_1_60)" id="face">
          <g filter="url(#filter0_i_1_60)" id="Ellipse 1">
            <path d={svgPaths.p1ac9c8c0} fill="var(--fill-0, white)" />
          </g>
          <rect fill="var(--fill-0, black)" height="11" id="Rectangle 1" width="4" x="18" y="20" />
          <rect fill="var(--fill-0, black)" height="11" id="Rectangle 2" width="4" x="33" y="20" />
        </g>
        <defs>
          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="57" id="filter0_i_1_60" width="56" x="0" y="0">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="12.5" />
            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.345098 0 0 0 0 0 0 0 0 1 0" />
            <feBlend in2="shape" mode="normal" result="effect1_innerShadow_1_60" />
          </filter>
          <clipPath id="clip0_1_60">
            <rect fill="white" height="56" width="56" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}