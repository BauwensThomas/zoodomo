// Télécharge tous les fichiers du bucket Storage "photos" dans un dossier local, pour être
// archivés par le workflow de backup (.github/workflows/backup-supabase.yml). Nécessite
// service_role (accès à tous les comptes, contourne RLS), voir docs/DECISIONS.md.
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const outDir = process.env.BACKUP_OUT_DIR ?? "./storage-backup";

if (!url || !serviceRoleKey) {
  console.error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY manquants.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);
const BUCKET = "photos";

async function listAllFiles(prefix) {
  const files = [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const entry of data ?? []) {
    const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Un "dossier" Supabase Storage n'a pas de `id`/métadonnées de fichier propres : on
    // descend dedans récursivement plutôt que de tenter de le télécharger comme un fichier.
    if (entry.id === null) {
      files.push(...(await listAllFiles(entryPath)));
    } else {
      files.push(entryPath);
    }
  }
  return files;
}

const files = await listAllFiles("");
console.log(`${files.length} fichier(s) à sauvegarder.`);

let downloaded = 0;
for (const filePath of files) {
  const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
  if (error) {
    console.error(`Échec du téléchargement de ${filePath} :`, error.message);
    continue;
  }
  const localPath = path.join(outDir, filePath);
  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, Buffer.from(await data.arrayBuffer()));
  downloaded += 1;
}

console.log(`${downloaded}/${files.length} fichier(s) téléchargé(s) dans ${outDir}.`);
