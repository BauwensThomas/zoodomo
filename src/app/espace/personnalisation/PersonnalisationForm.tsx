"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  GalleryHorizontal,
  Grid2x2,
  Grid3x3,
  Image as ImageIcon,
  LayoutGrid,
  Palette,
  PanelLeft,
  PanelRight,
  Rows3,
  Save,
  SplitSquareHorizontal,
  Text,
  Type,
} from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { AccountColorsSection } from "@/components/AccountColorsSection";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import { AutoDismiss } from "@/components/AutoDismiss";
import { POLICE_IDS, POLICE_FONT_VARS } from "@/lib/fonts";
import type { PoliceId } from "@/lib/fonts";
import { PersonnalisationPreviewPanel } from "@/components/preview/PersonnalisationPreviewPanel";
import type { PreviewContent, PreviewPage } from "@/components/preview/types";
import type { DispositionEspeces, DispositionGalerie, DispositionPresentation } from "@/types";
import { updatePersonnalisationAction, type SavedState } from "../actions";

const DISPOSITION_OPTIONS: { id: DispositionGalerie; icon: typeof LayoutGrid }[] = [
  { id: "grille", icon: Grid2x2 },
  { id: "empilee", icon: Rows3 },
  { id: "alternee", icon: SplitSquareHorizontal },
];

const ESPECES_OPTIONS: { id: DispositionEspeces; icon: typeof LayoutGrid }[] = [
  { id: "liste", icon: Rows3 },
  { id: "cote_a_cote", icon: GalleryHorizontal },
  { id: "vitrine", icon: Grid3x3 },
];

const PRESENTATION_OPTIONS: { id: DispositionPresentation; icon: typeof LayoutGrid }[] = [
  { id: "texte_photos", icon: Text },
  { id: "photo_texte", icon: PanelLeft },
  { id: "texte_photo", icon: PanelRight },
];

const initialState: SavedState = { saved: false };

/** Largeur du panneau de visualisation fixe, en pixels (aussi utilisée pour décaler l'onglet et le formulaire). */
const PREVIEW_PANEL_WIDTH = 460;

export function PersonnalisationForm({
  accountId,
  nomAffichage,
  currentPolice,
  currentDisposition,
  currentEspeces,
  currentPresentation,
  defaultPrimary,
  defaultSecondary,
  logoUrl,
  previewContent,
}: {
  accountId: string;
  nomAffichage: string;
  currentPolice: PoliceId;
  currentDisposition: DispositionGalerie;
  currentEspeces: DispositionEspeces;
  currentPresentation: DispositionPresentation;
  defaultPrimary: string;
  defaultSecondary: string;
  logoUrl: string | null;
  previewContent: PreviewContent;
}) {
  const t = useTranslations("admin.personnalisation");
  const [state, formAction] = useActionState(updatePersonnalisationAction, initialState);

  // Réglages visuels reflétés en direct dans le panneau d'aperçu (pas seulement au
  // rechargement après enregistrement) : les champs radio deviennent contrôlés pour
  // partager leur valeur courante avec `PersonnalisationPreviewPanel`, mais restent de
  // vrais champs de formulaire (`name`/`value`) pour la soumission classique par FormData.
  const [police, setPolice] = useState<PoliceId>(currentPolice);
  const [primary, setPrimary] = useState(defaultPrimary);
  const [secondary, setSecondary] = useState(defaultSecondary);
  const [dispositionEspeces, setDispositionEspeces] = useState<DispositionEspeces>(currentEspeces);
  const [dispositionPresentation, setDispositionPresentation] =
    useState<DispositionPresentation>(currentPresentation);
  const [dispositionGalerie, setDispositionGalerie] = useState<DispositionGalerie>(currentDisposition);
  const [showPreview, setShowPreview] = useState(false);
  // Onglet du panneau de visualisation basculé automatiquement vers la page publique
  // concernée par le réglage qu'on vient de changer (accueil par défaut, catégorie pour la
  // disposition de la galerie), en plus de l'ouverture automatique du panneau lui-même.
  const [previewPage, setPreviewPage] = useState<PreviewPage>("accueil");

  const previewSettings = {
    police,
    primary,
    secondary,
    dispositionEspeces,
    dispositionPresentation,
    dispositionGalerie,
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPreview((v) => !v)}
        className="fixed top-1/2 z-40 flex -translate-y-1/2 cursor-pointer items-center gap-2 rounded-l-xl border border-r-0 border-border bg-foreground px-2.5 py-4 text-xs font-semibold text-background shadow-lg transition-[right] duration-300 ease-in-out hover:opacity-90"
        style={{ right: showPreview ? PREVIEW_PANEL_WIDTH : 0, writingMode: "vertical-rl" }}
      >
        {showPreview ? <EyeOff className="h-4 w-4 rotate-90" /> : <Eye className="h-4 w-4 rotate-90" />}
        {t("previewToggle")}
      </button>

      {/* Panneau fixe : reste à l'écran quel que soit le défilement de la page (contrairement
          à `sticky`, ancré au parent), glisse depuis le bord droit à l'ouverture/fermeture.
          Toujours monté (même masqué) pour que la transition de glissement s'anime. */}
      <div
        className="fixed inset-y-0 right-0 z-30 w-full overflow-y-auto border-l border-border bg-muted/40 p-4 shadow-2xl transition-transform duration-300 ease-in-out"
        style={{
          maxWidth: PREVIEW_PANEL_WIDTH,
          transform: showPreview ? "translateX(0)" : "translateX(100%)",
          pointerEvents: showPreview ? "auto" : "none",
        }}
      >
        <PersonnalisationPreviewPanel
          content={previewContent}
          settings={previewSettings}
          page={previewPage}
          onPageChange={setPreviewPage}
        />
      </div>

      <div className={showPreview ? "xl:pr-115" : ""}>
        <form action={formAction} className="mt-4 space-y-4">
          <SectionCard icon={Type} accent="indigo" title={t("sectionPolice")} hint={t("policeHint")}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {POLICE_IDS.map((id) => (
                <label
                  key={id}
                  className="group flex cursor-pointer flex-col gap-2 rounded-2xl border-2 border-border bg-card p-4 transition-colors has-checked:border-green-600 has-checked:bg-green-50"
                >
                  <input
                    type="radio"
                    name="police"
                    value={id}
                    checked={police === id}
                    onChange={() => {
                      setPolice(id);
                      setShowPreview(true);
                      setPreviewPage("accueil");
                    }}
                    className="sr-only"
                  />
                  <span
                    className="text-lg font-medium text-foreground group-has-checked:text-green-900"
                    style={{ fontFamily: POLICE_FONT_VARS[id].heading }}
                  >
                    {nomAffichage}
                  </span>
                  <span
                    className="text-xs text-foreground group-has-checked:text-green-900"
                    style={{ fontFamily: POLICE_FONT_VARS[id].body }}
                  >
                    {t(`police.${id}`)}
                  </span>
                </label>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Palette} accent="pink" title={t("sectionColors")} hint={t("colorsHint")}>
            <AccountColorsSection
              defaultPrimary={defaultPrimary}
              defaultSecondary={defaultSecondary}
              primaryLabel={t("colorPrimary")}
              primaryHint={t("colorPrimaryHint")}
              secondaryLabel={t("colorSecondary")}
              secondaryHint={t("colorSecondaryHint")}
              onPrimaryChange={(value) => {
                setPrimary(value);
                setShowPreview(true);
                setPreviewPage("accueil");
              }}
              onSecondaryChange={(value) => {
                setSecondary(value);
                setShowPreview(true);
                setPreviewPage("accueil");
              }}
            />
          </SectionCard>

          <SectionCard icon={ImageIcon} accent="amber" title={t("sectionLogo")} hint={t("logoHint")}>
            <PhotoUploadField
              name="logo"
              accountId={accountId}
              category="logo"
              defaultPhotos={logoUrl ? [logoUrl] : []}
              maxPhotos={1}
              dropLabel={t("logoDropLabel")}
              maxReachedLabel={t("logoMaxReached")}
              removeLabel={t("logoRemoveAria")}
              uploadErrorLabel={t("logoUploadError")}
            />
          </SectionCard>

          <SectionCard icon={Rows3} accent="cyan" title={t("sectionEspeces")} hint={t("especesHint")}>
            <div className="grid gap-3 sm:grid-cols-3">
              {ESPECES_OPTIONS.map(({ id, icon: Icon }) => (
                <label
                  key={id}
                  className="group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-4 text-center transition-colors has-checked:border-green-600 has-checked:bg-green-50"
                >
                  <input
                    type="radio"
                    name="disposition_especes"
                    value={id}
                    checked={dispositionEspeces === id}
                    onChange={() => {
                      setDispositionEspeces(id);
                      setShowPreview(true);
                      setPreviewPage("accueil");
                    }}
                    className="sr-only"
                  />
                  <Icon className="h-6 w-6 text-foreground group-has-checked:text-green-900" />
                  <span className="text-sm font-medium text-foreground group-has-checked:text-green-900">
                    {t(`especes.${id}.label`)}
                  </span>
                  <span className="text-xs text-foreground group-has-checked:text-green-900">{t(`especes.${id}.hint`)}</span>
                </label>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={PanelLeft}
            accent="purple"
            title={t("sectionPresentation")}
            hint={t("presentationHint")}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {PRESENTATION_OPTIONS.map(({ id, icon: Icon }) => (
                <label
                  key={id}
                  className="group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-4 text-center transition-colors has-checked:border-green-600 has-checked:bg-green-50"
                >
                  <input
                    type="radio"
                    name="disposition_presentation"
                    value={id}
                    checked={dispositionPresentation === id}
                    onChange={() => {
                      setDispositionPresentation(id);
                      setShowPreview(true);
                      setPreviewPage("accueil");
                    }}
                    className="sr-only"
                  />
                  <Icon className="h-6 w-6 text-foreground group-has-checked:text-green-900" />
                  <span className="text-sm font-medium text-foreground group-has-checked:text-green-900">
                    {t(`presentation.${id}.label`)}
                  </span>
                  <span className="text-xs text-foreground group-has-checked:text-green-900">{t(`presentation.${id}.hint`)}</span>
                </label>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={LayoutGrid}
            accent="emerald"
            title={t("sectionDisposition")}
            hint={t("dispositionHint")}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {DISPOSITION_OPTIONS.map(({ id, icon: Icon }) => (
                <label
                  key={id}
                  className="group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-4 text-center transition-colors has-checked:border-green-600 has-checked:bg-green-50"
                >
                  <input
                    type="radio"
                    name="disposition_photos"
                    value={id}
                    checked={dispositionGalerie === id}
                    onChange={() => {
                      setDispositionGalerie(id);
                      setShowPreview(true);
                      setPreviewPage("categorie");
                    }}
                    className="sr-only"
                  />
                  <Icon className="h-6 w-6 text-foreground group-has-checked:text-green-900" />
                  <span className="text-sm font-medium text-foreground group-has-checked:text-green-900">
                    {t(`disposition.${id}.label`)}
                  </span>
                  <span className="text-xs text-foreground group-has-checked:text-green-900">{t(`disposition.${id}.hint`)}</span>
                </label>
              ))}
            </div>
          </SectionCard>

          <div className="flex items-center justify-end gap-3">
            {state.saved && (
              <AutoDismiss key={state.savedAt}>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("savedConfirmation")}
                </span>
              </AutoDismiss>
            )}
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
