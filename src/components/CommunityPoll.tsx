import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  BRING_BACK_OPTION_ID,
  BRING_BACK_OPTIONS,
  buildVoteResults,
  createEmptyVoteCounts,
  formatBringBackChoice,
  generatePollSessionId,
  hashPollSessionId,
  getVotePercentage,
  POLL_SESSION_STORAGE_KEY,
  POLL_OPTIONS,
  POLL_VOTED_STORAGE_KEY,
  type BringBackOptionId,
  type PollOptionId,
} from "@/lib/communityPoll";
import {
  createEventVote,
  findEventVoteBySessionId,
  isFirebaseEnabled,
  listEventVotes,
  type EventVoteDoc,
} from "@/lib/firebase";

function getOrCreateSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existingSessionId = window.localStorage.getItem(POLL_SESSION_STORAGE_KEY)?.trim();
  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId = generatePollSessionId();
  window.localStorage.setItem(POLL_SESSION_STORAGE_KEY, nextSessionId);
  return nextSessionId;
}

function formatPollError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Could not complete the poll request right now.";

  if (/missing or insufficient permissions|permission-denied/i.test(message)) {
    return "Firebase is connected, but Firestore rules still block event_votes. Publish the poll rules for this project, then try again.";
  }

  return message;
}

export default function CommunityPoll() {
  const firebaseEnabled = isFirebaseEnabled();
  const [selectedOption, setSelectedOption] = useState<PollOptionId | "">("");
  const [bringBackPick, setBringBackPick] = useState<BringBackOptionId | "">("");
  const [writeIn, setWriteIn] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [results, setResults] = useState(() => createEmptyVoteCounts());
  const [totalVotes, setTotalVotes] = useState(0);
  const [submittedVote, setSubmittedVote] = useState<EventVoteDoc | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [animateResults, setAnimateResults] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const bringBackSelected = selectedOption === BRING_BACK_OPTION_ID;
  const currentVoteSummary = useMemo(
    () =>
      submittedVote?.option === BRING_BACK_OPTION_ID
        ? `Your vote: Bring Back a Past Event${submittedVote.bringBackPick ? ` - ${formatBringBackChoice(submittedVote.bringBackPick)}` : ""}`
        : submittedVote
          ? `Your vote: ${POLL_OPTIONS.find((option) => option.id === submittedVote.option)?.label ?? "Saved"}`
          : "",
    [submittedVote],
  );

  async function loadResults() {
    const votes = await listEventVotes();
    const { counts, total } = buildVoteResults(votes);
    setResults(counts);
    setTotalVotes(total);
  }

  useEffect(() => {
    let active = true;

    async function initializePoll() {
      const nextSessionId = getOrCreateSessionId();
      if (!active) {
        return;
      }

      setSessionId(nextSessionId);

      if (!firebaseEnabled) {
        setIsBootstrapping(false);
        return;
      }

      const alreadyVoted =
        typeof window !== "undefined" && window.localStorage.getItem(POLL_VOTED_STORAGE_KEY) === "true";
      if (!alreadyVoted) {
        setIsBootstrapping(false);
        return;
      }

      setShowResults(true);

      try {
        const storedSessionId = await hashPollSessionId(nextSessionId);
        const [existingVote, votes] = await Promise.all([
          findEventVoteBySessionId(storedSessionId),
          listEventVotes(),
        ]);

        if (!active) {
          return;
        }

        const { counts: nextCounts, total } = buildVoteResults(votes);
        setSubmittedVote(existingVote);
        setResults(nextCounts);
        setTotalVotes(total);
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          formatPollError(error) || "Could not load the latest poll results right now.",
        );
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    }

    void initializePoll();

    return () => {
      active = false;
    };
  }, [firebaseEnabled]);

  useEffect(() => {
    if (!showResults || typeof window === "undefined") {
      setAnimateResults(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setAnimateResults(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [results, showResults, totalVotes]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!firebaseEnabled) {
      setErrorMessage("Voting is offline right now. Double-check the Firebase config and Firestore setup.");
      return;
    }

    if (!selectedOption) {
      setErrorMessage("Pick the idea you want us to explore next.");
      return;
    }

    if (selectedOption === BRING_BACK_OPTION_ID && !bringBackPick) {
      setErrorMessage("Choose which past event you want us to bring back.");
      return;
    }

    if (!sessionId) {
      setErrorMessage("Could not start a voting session. Refresh and try one more time.");
      return;
    }

    const trimmedWriteIn =
      selectedOption === BRING_BACK_OPTION_ID && writeIn.trim().length > 0 ? writeIn.trim() : null;

    setIsSubmitting(true);
    setErrorMessage("");
    setAnimateResults(false);

    try {
      const storedSessionId = await hashPollSessionId(sessionId);
      const existingVote = await findEventVoteBySessionId(storedSessionId);
      let savedVote = existingVote;

      if (!existingVote) {
        savedVote = {
          id: "",
          sessionId: storedSessionId,
          option: selectedOption,
          bringBackPick: selectedOption === BRING_BACK_OPTION_ID ? bringBackPick : null,
          writeIn: trimmedWriteIn,
        };

        await createEventVote({
          sessionId: storedSessionId,
          option: selectedOption,
          bringBackPick: selectedOption === BRING_BACK_OPTION_ID ? bringBackPick : null,
          writeIn: trimmedWriteIn,
        });
      }

      setSubmittedVote(savedVote);
      setShowResults(true);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(POLL_VOTED_STORAGE_KEY, "true");
      }

      await loadResults();
    } catch (error) {
      setErrorMessage(formatPollError(error) || "Could not cast your vote right now. Please try again in a minute.");
    } finally {
      setIsSubmitting(false);
      setIsBootstrapping(false);
    }
  }

  return (
    <section id="vote" className="border-y border-border/70 bg-secondary px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          {isBootstrapping ? (
            <div className="space-y-6" aria-live="polite">
              <div className="h-10 w-72 rounded-full bg-muted" />
              <div className="space-y-0 divide-y divide-border">
                {POLL_OPTIONS.map((option) => (
                  <div key={option.id} className="h-20 py-4" />
                ))}
              </div>
            </div>
          ) : showResults ? (
            <div className="space-y-8" aria-live="polite">
              <div className="space-y-3">
                <h2 className="text-3xl font-heading font-bold tracking-tight sm:text-4xl">
                  What should we try next? Help us decide!
                </h2>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>{totalVotes === 1 ? "1 vote so far." : `${totalVotes} votes so far.`}</p>
                  {currentVoteSummary && <p className="font-medium text-foreground">{currentVoteSummary}</p>}
                </div>
              </div>

              {!firebaseEnabled && (
                <p className="text-sm text-muted-foreground">
                  Voting comes online once Firebase and Firestore are both connected for this build.
                </p>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-5">
                {POLL_OPTIONS.map((option, index) => {
                  const count = results[option.id] ?? 0;
                  const percentage = getVotePercentage(count, totalVotes);

                  return (
                    <div key={option.id} className="border-b border-border pb-5 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {option.emoji} {option.label}
                          </p>
                          {option.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-foreground">{percentage}%</div>
                          <div className="text-xs text-muted-foreground">
                            {count} vote{count === 1 ? "" : "s"}
                          </div>
                        </div>
                      </div>
                      <div
                        className="mt-3 h-3 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-label={`${option.label}: ${percentage}%`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percentage}
                      >
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.72)_100%)] transition-[width] duration-700 ease-out"
                          style={{
                            width: animateResults ? `${percentage}%` : "0%",
                            transitionDelay: `${index * 70}ms`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                We read every single vote. This is how we decide what&apos;s next.
              </p>
            </div>
          ) : (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <h2 className="text-3xl font-heading font-bold tracking-tight sm:text-4xl">
                  What should we try next? Help us decide!
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  One vote per browser session. No pressure, just signal.
                </p>
              </div>

              {!firebaseEnabled && (
                <p className="text-sm text-muted-foreground">
                  Voting comes online once Firebase and Firestore are both connected for this build.
                </p>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
                  {errorMessage}
                </div>
              )}

              <fieldset className="space-y-0">
                <legend className="sr-only">What should we try next?</legend>
                <RadioGroup
                  value={selectedOption}
                  onValueChange={(value) => {
                    setSelectedOption(value as PollOptionId);
                    setErrorMessage("");
                  }}
                  className="space-y-0"
                >
                  {POLL_OPTIONS.map((option) => {
                    const inputId = `poll-option-${option.id}`;

                    return (
                      <div key={option.id} className="border-b border-border py-4 last:border-b-0">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem
                            id={inputId}
                            value={option.id}
                            className="mt-1 border-primary text-primary"
                          />
                          <Label htmlFor={inputId} className="flex-1 cursor-pointer space-y-1">
                            <div className="text-base font-medium leading-6 text-foreground">
                              {option.emoji} {option.label}
                            </div>
                            {option.description && (
                              <p className="text-sm leading-6 text-muted-foreground">{option.description}</p>
                            )}
                          </Label>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </fieldset>

              {bringBackSelected && (
                <fieldset className="space-y-4 border-l border-border pl-5">
                  <legend className="text-base font-heading font-semibold text-foreground">
                    Which one should we bring back?
                  </legend>
                  <RadioGroup
                    value={bringBackPick}
                    onValueChange={(value) => {
                      setBringBackPick(value as BringBackOptionId);
                      setErrorMessage("");
                    }}
                    className="space-y-3"
                  >
                    {BRING_BACK_OPTIONS.map((option) => {
                      const inputId = `bring-back-${option.id}`;

                      return (
                        <div key={option.id} className="flex items-start gap-3">
                          <RadioGroupItem
                            id={inputId}
                            value={option.id}
                            className="mt-1 border-primary text-primary"
                          />
                          <Label htmlFor={inputId} className="flex-1 cursor-pointer text-base font-medium leading-6 text-foreground">
                            {option.emoji} {option.label}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>

                  <div className="space-y-2">
                    <Label htmlFor="poll-write-in" className="text-sm text-muted-foreground">
                      Other thoughts or event ideas
                    </Label>
                    <Textarea
                      id="poll-write-in"
                      placeholder="Other thoughts or event ideas..."
                      value={writeIn}
                      onChange={(event) => setWriteIn(event.target.value)}
                      className="min-h-[110px]"
                    />
                  </div>
                </fieldset>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || !firebaseEnabled}
                  className="w-full rounded-full sm:w-auto"
                >
                  {isSubmitting ? "Saving..." : "Cast My Vote \u2192"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
