"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction, type DeleteAccountState } from "../actions";

const initialState: DeleteAccountState = {};

/** Danger zone de l'onglet Compte : suppression définitive du compte, retape de l'email
 * requise avant que le bouton ne s'active (voir `deleteAccountAction`, `espace/actions.ts`,
 * pour l'ordre exact des opérations : email vérifié, résiliation Paddle immédiate, suppression
 * réelle des données, déconnexion). Toujours affichée, contrairement à "Gérer mon
 * abonnement" (qui ne l'est que si un abonnement existe) : un compte encore en essai doit
 * pouvoir se supprimer aussi. */
export function DeleteAccountSection({
  email,
  title,
  warning,
  confirmLabel,
  button,
  confirmDialog,
  errors,
}: {
  email: string;
  title: string;
  warning: string;
  confirmLabel: string;
  button: string;
  confirmDialog: string;
  errors: {
    email_mismatch: string;
    paddle_cancel_failed: string;
    delete_failed: string;
  };
}) {
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);
  const [confirmEmail, setConfirmEmail] = useState("");
  const matches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

  return (
    <div className="mt-8 max-w-2xl rounded-2xl border border-red-300 bg-red-50 p-5">
      <h2 className="font-heading text-lg font-medium text-red-900">{title}</h2>
      <p className="mt-1.5 text-sm text-red-900">{warning}</p>

      <form action={formAction} className="mt-4 space-y-3">
        <div>
          <label htmlFor="confirmEmail" className="block text-sm font-medium text-red-900">
            {confirmLabel}
          </label>
          <input
            id="confirmEmail"
            name="confirmEmail"
            type="email"
            required
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-red-300 bg-white px-3.5 py-2.5 text-sm text-red-900 outline-none focus:border-red-500"
          />
        </div>

        {state.error && <p className="text-sm font-medium text-red-700">{errors[state.error]}</p>}

        <button
          type="submit"
          disabled={!matches || pending}
          onClick={(e) => {
            if (!window.confirm(confirmDialog)) e.preventDefault();
          }}
          className="cursor-pointer rounded-full bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {button}
        </button>
      </form>
    </div>
  );
}
