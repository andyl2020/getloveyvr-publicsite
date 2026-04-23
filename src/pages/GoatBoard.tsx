import { useEffect, useRef, useState, type ReactNode } from "react";
import { Home, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardBoard from "@/board/DashboardBoard.jsx";
import { Button } from "@/components/ui/button";
import { useEventSchedule } from "@/hooks/useEventSchedule";
import {
  canEditEmail,
  getGoatRole,
  getPrimaryMasterGoatEmail,
  isFirebaseEnabled,
  saveEventSchedule,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
  type GoatRole,
} from "@/lib/firebase";

const logo = `${import.meta.env.BASE_URL}logo-mark.png`;

function AccessShell({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur-md">
        <div className="container max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="GetLoveYVR logo" className="h-9 w-9" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                GetLoveYVR
              </div>
              <div className="font-heading text-lg font-semibold">{title}</div>
            </div>
          </Link>
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to site
            </Link>
          </Button>
        </div>
      </header>

      <main className="px-4 py-14">
        <div className="container mx-auto max-w-2xl">
          <div className="rounded-[32px] border border-border/70 bg-card/85 p-8 shadow-xl">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {eyebrow}
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GoatBoard() {
  const firebaseEnabled = isFirebaseEnabled();
  const { schedule, scheduleDocExists, scheduleSyncError } = useEventSchedule();
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const seedAttemptedRef = useRef(false);

  useEffect(() => {
    if (!firebaseEnabled) {
      return () => {};
    }

    return subscribeToAuthState((user) => {
      setCurrentUser(user);
      setAuthError("");
    });
  }, [firebaseEnabled]);

  const accessRole: GoatRole | null = getGoatRole(currentUser?.email);
  const primaryMasterGoatEmail = getPrimaryMasterGoatEmail();

  async function handleSignIn() {
    setIsSigningIn(true);
    setAuthError("");

    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError(error?.message || "Could not open Google sign-in.");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOutUser();
    } catch (error) {
      setAuthError(error?.message || "Could not sign out right now.");
    }
  }

  async function handleSeedSchedule() {
    if (!currentUser?.email || seedAttemptedRef.current) {
      return;
    }

    seedAttemptedRef.current = true;
    await saveEventSchedule(schedule, currentUser.email);
  }

  async function handleUpdateEventDate(eventId: number, nextDate: string) {
    if (!currentUser?.email) {
      throw new Error("Please sign in again before saving.");
    }

    const nextSchedule = schedule.map((event) =>
      event.id === eventId ? { ...event, eventDate: nextDate } : event,
    );

    await saveEventSchedule(nextSchedule, currentUser.email);
  }

  if (!firebaseEnabled) {
    return (
      <AccessShell eyebrow="Config" title="Goat Board">
        <h1 className="mb-3 font-heading text-4xl font-bold">Goat board is offline.</h1>
        <p className="text-muted-foreground">
          Firebase isn&apos;t configured in this build yet, so the protected board can&apos;t load.
        </p>
      </AccessShell>
    );
  }

  if (!currentUser) {
    return (
      <AccessShell eyebrow="Login" title="Goat Board">
        <h1 className="mb-3 font-heading text-4xl font-bold">Sneak into the goat board.</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          Sign in with Google to see whether you&apos;ve been granted goat privileges. Master goats
          can edit. Regular goats can browse. Everyone else gets lovingly trolled.
        </p>
        {primaryMasterGoatEmail && (
          <p className="mb-6 rounded-2xl border border-border/70 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            Current master goat: <span className="font-medium text-foreground">{primaryMasterGoatEmail}</span>
          </p>
        )}
        {authError && <p className="mb-4 text-sm text-destructive">{authError}</p>}
        <Button size="lg" onClick={handleSignIn} disabled={isSigningIn}>
          <LogIn className="mr-2 h-4 w-4" />
          {isSigningIn ? "Opening Google..." : "Login with Google"}
        </Button>
      </AccessShell>
    );
  }

  if (!accessRole) {
    return (
      <AccessShell eyebrow="Access denied" title="Goat Board">
        <h1 className="mb-3 font-heading text-4xl font-bold">
          Oops. This is awkward.
        </h1>
        <p className="mb-4 text-lg text-muted-foreground">
          You logged in successfully, but the board took one look and said, &quot;there&apos;s actually
          nothing here for you to see.&quot;
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{currentUser.email}</span>.
          Try again with the goat-approved email or ask for goat clearance.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return to events
            </Link>
          </Button>
        </div>
      </AccessShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d16]">
      <header className="border-b border-white/10 bg-[#081220]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-white">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="GetLoveYVR logo" className="h-9 w-9" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                GetLoveYVR
              </div>
              <div className="font-heading text-lg font-semibold">Goat Board</div>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4" />
              {accessRole === "master-goat" ? "Master Goat" : "Goat"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {currentUser.email}
            </span>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {(scheduleSyncError || !scheduleDocExists) && (
        <div className="mx-auto max-w-6xl px-4 pt-5 text-sm text-white/75">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            {scheduleSyncError
              ? scheduleSyncError
              : "Using the built-in schedule for now. The shared schedule will seed itself when a master goat saves."}
          </div>
        </div>
      )}

      <DashboardBoard
        accessRole={accessRole}
        currentUser={currentUser}
        onSeedSchedule={canEditEmail(currentUser.email) ? handleSeedSchedule : undefined}
        onUpdateEventDate={canEditEmail(currentUser.email) ? handleUpdateEventDate : undefined}
        schedule={schedule}
        scheduleDocExists={scheduleDocExists}
      />
    </div>
  );
}
