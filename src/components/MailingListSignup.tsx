import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMailingListSignup,
  isFirebaseEnabled,
} from "@/lib/firebase";
import {
  isValidMailingListEmail,
  MAILING_LIST_STORAGE_KEY,
} from "@/lib/mailingList";

function formatMailingListError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Could not save your email right now.";

  if (/missing or insufficient permissions|permission-denied/i.test(message)) {
    return "Firebase is connected, but Firestore rules still block mailing_list_signups. Publish the new rules for this project, then try again.";
  }

  return message;
}

export default function MailingListSignup() {
  const firebaseEnabled = isFirebaseEnabled();
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedEmail = window.localStorage.getItem(MAILING_LIST_STORAGE_KEY)?.trim();
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!firebaseEnabled) {
      setErrorMessage("Signup is offline right now. Double-check the Firebase config and Firestore setup.");
      setSuccessMessage("");
      return;
    }

    if (!isValidMailingListEmail(email)) {
      setErrorMessage("Enter a valid email so we know where to send the next event drop.");
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { alreadySubscribed, signup } = await createMailingListSignup(email);

      setEmail(signup.email);
      setSuccessMessage(
        alreadySubscribed
          ? "You’re already on the list. We’ll send the next drop there."
          : "You’re on the list. We’ll send the next drop there.",
      );

      if (typeof window !== "undefined") {
        window.localStorage.setItem(MAILING_LIST_STORAGE_KEY, signup.email);
      }
    } catch (error) {
      setErrorMessage(formatMailingListError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[28px] bg-background p-6 text-foreground shadow-xl shadow-black/10 ring-1 ring-black/5 sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-heading font-bold tracking-tight">Join the mailing list</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Get the next event drop, early access links, and the occasional last-minute spot.
            Low-pressure. Useful emails only.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="mailing-list-email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="mailing-list-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="h-12 rounded-full border-border/70 px-5"
              aria-describedby="mailing-list-help"
              disabled={isSubmitting}
            />
            <Button type="submit" size="lg" className="h-12 rounded-full px-6" disabled={isSubmitting || !firebaseEnabled}>
              {isSubmitting ? "Saving..." : "Join the List"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <p id="mailing-list-help" className="text-sm text-muted-foreground">
          We’ll only use this for GetLoveYVR updates.
        </p>

        {successMessage && (
          <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary" role="status">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {errorMessage}
          </div>
        )}

        {!firebaseEnabled && (
          <p className="text-sm text-muted-foreground">
            Signup comes online once Firebase and Firestore are both connected for this build.
          </p>
        )}
      </form>
    </div>
  );
}
