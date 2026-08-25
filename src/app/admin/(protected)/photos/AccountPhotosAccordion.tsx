"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface PhotoFile {
  path: string;
  size: number;
  url: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Nom + email toujours visibles, photos repliées par défaut : les `<img>` ne sont montées
 * dans le DOM (donc téléchargées par le navigateur) qu'une fois le menu déroulé, pour éviter
 * de charger les photos de tous les comptes d'un coup au chargement de la page, demande
 * utilisateur du 2026-08-25. Les chemins/tailles/URLs restent calculés côté serveur (lecture
 * de métadonnées Storage seule, aucun octet d'image transféré), seul le rendu des `<img>`
 * est différé ici. */
export function AccountPhotosAccordion({
  nom,
  email,
  files,
}: {
  nom: string;
  email: string;
  files: PhotoFile[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-foreground bg-card p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-medium text-foreground">
            {nom} ({files.length})
          </p>
          <p className="text-xs text-foreground">{email}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {files.map((file) => (
            <a key={file.path} href={file.url} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element -- consultation seule, tous comptes confondus, pas besoin de l'optimisation next/image ici */}
              <img src={file.url} alt={file.path} className="aspect-square w-full rounded-lg object-cover" />
              <p className="mt-1 truncate text-xs text-foreground" title={file.path}>
                {formatSize(file.size)}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
