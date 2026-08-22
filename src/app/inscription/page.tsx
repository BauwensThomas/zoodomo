import { signupsEnabled } from "@/lib/signups";
import { InscriptionForm } from "./InscriptionForm";

export default function InscriptionPage() {
  return <InscriptionForm signupsEnabled={signupsEnabled()} />;
}
