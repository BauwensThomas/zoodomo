const ACCENT_COLOR = "#221c16";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Un paragraphe par ligne non vide, texte échappé (le corps peut contenir du texte libre
 * saisi par un utilisateur, ex. un message "contacter le webmaster"). */
function renderParagraphs(body: string): string {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px;color:${ACCENT_COLOR};font-size:15px;line-height:1.5;">${escapeHtml(line)}</p>`)
    .join("");
}

/**
 * Gabarit HTML minimal partagé par les emails applicatifs (nouveau message, rappels
 * d'essai/de fiche) : un seul bloc de langue, contrairement aux emails d'authentification
 * gérés par Supabase Auth (trilingues empilés), puisque ceux-ci ciblent toujours un
 * destinataire et une langue déjà connus. Même couleur d'accent que ces derniers (#221c16).
 */
export function renderEmailHtml({
  title,
  body,
  buttonLabel,
  buttonUrl,
}: {
  title: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background-color:#f5f2ec;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 16px;color:${ACCENT_COLOR};font-size:20px;font-weight:600;">${escapeHtml(title)}</h1>
                ${renderParagraphs(body)}
                ${
                  buttonLabel && buttonUrl
                    ? `<a href="${buttonUrl}" style="display:inline-block;margin-top:8px;padding:12px 24px;background-color:${ACCENT_COLOR};color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">${escapeHtml(buttonLabel)}</a>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
