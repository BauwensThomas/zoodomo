"use client";

/**
 * Décode une `data:` URL base64 en `Blob`, de façon strictement synchrone (pas de `fetch`,
 * pas d'`await`) : `window.open` n'est autorisé par le navigateur que s'il est appelé de
 * façon synchrone en réaction directe à un clic. Un `await` avant, même bref (`fetch` d'une
 * `data:` URL par exemple), fait perdre ce contexte "clic utilisateur" et le nouvel onglet
 * est alors bloqué silencieusement.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Ouvre une photo (stockée en `data:` URL, phase mockée) dans un nouvel onglet. Un simple
 * `<a href="data:..." target="_blank">` ne fonctionne pas : Chrome bloque silencieusement la
 * navigation directe vers une URL `data:` déclenchée par un clic (protection anti-abus des
 * navigateurs). Contournement : convertir la `data:` URL en URL `blob:` (voir
 * `dataUrlToBlob`), qui n'est pas soumise à cette restriction, puis ouvrir celle-ci avec
 * `window.open`, en gardant toute l'opération synchrone (voir `dataUrlToBlob`).
 */
export function OpenPhotoLink({
  photoUrl,
  alt,
  className,
}: {
  photoUrl: string;
  alt: string;
  className: string;
}) {
  function handleClick() {
    const blobUrl = URL.createObjectURL(dataUrlToBlob(photoUrl));
    window.open(blobUrl, "_blank");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="cursor-pointer overflow-hidden rounded-lg border border-border"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoUrl} alt={alt} className={className} />
    </button>
  );
}
