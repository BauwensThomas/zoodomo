/** Rendu partagé par les CGU et la politique de confidentialité : chaque section vient de
 * `t.raw(...)` (tableau {title, body} dans messages/{fr,nl,en}.json), le corps peut contenir
 * plusieurs paragraphes séparés par une ligne vide (`whitespace-pre-line`), même convention
 * que les autres textes libres de l'app (messages, description de fiche animal). */
export function LegalSections({ sections }: { sections: { title: string; body: string }[] }) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.title} className="mt-8">
          <h2 className="font-heading text-xl font-medium tracking-tight text-foreground">
            {section.title}
          </h2>
          <p className="mt-3 whitespace-pre-line text-foreground">{section.body}</p>
        </div>
      ))}
    </>
  );
}
