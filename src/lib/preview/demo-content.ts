import demoContentJson from "./demo-content.json";
import type { PreviewContent } from "@/components/preview/types";

/**
 * Contenu de démonstration pour le panneau de visualisation de Personnalisation : des
 * espèces, animaux et photos d'exemple, fixes et identiques pour tous les comptes, plutôt
 * que le vrai contenu du compte connecté ("ça ne doit pas être le site du pro", retour
 * utilisateur). Fichier `.json` à part exprès (voir `demo-content.json`) : ce contenu reste
 * un jeu de données statique livré avec l'application (photos + JSON déployés avec le site),
 * par opposition aux vraies données client qui, une fois Supabase branché, vivront en base.
 * Seuls les réglages visuels (police, couleurs, dispositions) du compte connecté restent
 * appliqués par-dessus ce contenu figé.
 */
export const PREVIEW_DEMO_CONTENT: PreviewContent = demoContentJson as PreviewContent;
