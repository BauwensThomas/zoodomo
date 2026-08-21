import Image from "next/image";

// Dimensions intrinsèques du fichier source (public/brand/zoodomo-wordmark.png)
const INTRINSIC_WIDTH = 480;
const INTRINSIC_HEIGHT = 110;

export function ZoodomoLogo({ width = 140 }: { width?: number }) {
  const height = Math.round((width / INTRINSIC_WIDTH) * INTRINSIC_HEIGHT);

  return (
    <Image
      src="/brand/zoodomo-wordmark.png"
      alt="Zoodomo"
      width={width}
      height={height}
      unoptimized
      loading="eager"
    />
  );
}
