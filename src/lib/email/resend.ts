import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Emails applicatifs uniquement (nouveau message, rappels d'essai/de fiche) : ne remplace pas
 * les emails d'authentification, gérés par Supabase Auth via son propre SMTP, voir
 * `.env.local`. Un échec d'envoi ne doit jamais faire échouer l'action réelle (le message a
 * déjà été enregistré en base) : loggué seulement, jamais remonté à l'utilisateur.
 */
export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  } catch (error) {
    console.error("[sendEmail] Échec de l'envoi :", error);
  }
}
