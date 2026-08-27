import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  Varela_Round,
  Nunito_Sans,
  Poppins,
  Inter,
  Playfair_Display,
  Source_Sans_3,
  Fredoka,
  Quicksand,
} from "next/font/google";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Analytics } from "@vercel/analytics/next";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import "./globals.css";

// Chaque paire (titre + texte) est préchargée une fois ici avec sa propre variable CSS ;
// le compte choisit une "police" dans Personnalisation, et [compte]/layout.tsx redéfinit
// --font-heading/--font-body pour pointer vers la paire choisie (voir POLICE_OPTIONS dans
// src/lib/fonts.ts). Permet de changer de police par compte sans charger de police à la volée.
const varelaRound = Varela_Round({ variable: "--font-heading-default", weight: "400", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({ variable: "--font-body-default", subsets: ["latin"] });

const poppins = Poppins({ variable: "--font-heading-moderne", weight: ["400", "500", "600", "700"], subsets: ["latin"] });
const inter = Inter({ variable: "--font-body-moderne", subsets: ["latin"] });

const playfairDisplay = Playfair_Display({ variable: "--font-heading-classique", weight: ["400", "500", "600", "700"], subsets: ["latin"] });
const sourceSans3 = Source_Sans_3({ variable: "--font-body-classique", subsets: ["latin"] });

const fredoka = Fredoka({ variable: "--font-heading-arrondie", weight: ["400", "500", "600", "700"], subsets: ["latin"] });
const quicksand = Quicksand({ variable: "--font-body-arrondie", weight: ["400", "500", "600", "700"], subsets: ["latin"] });

const FONT_VARIABLES = [
  varelaRound.variable,
  nunitoSans.variable,
  poppins.variable,
  inter.variable,
  playfairDisplay.variable,
  sourceSans3.variable,
  fredoka.variable,
  quicksand.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Zoodomo",
  description: "Fiches animaux pour refuges et vendeurs professionnels",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const cookieConsentAck = cookieStore.get("COOKIE_CONSENT_ACK")?.value === "1";
  const themePreference = cookieStore.get("THEME_PREFERENCE")?.value;
  const theme = themePreference === "light" || themePreference === "dark" ? themePreference : undefined;
  const t = await getTranslations("common.cookieBanner");

  return (
    <html lang={locale} className={`${FONT_VARIABLES} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieConsentBanner
            initiallyAcknowledged={cookieConsentAck}
            theme={theme}
            message={t("message")}
            privacyLinkLabel={t("privacyLink")}
            button={t("button")}
          />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
