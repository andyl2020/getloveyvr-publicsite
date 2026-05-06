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
        const [existingVote, votes] = await Promise.all([
          findEventVoteBySessionId(nextSessionId),
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
          error instanceof Error ? error.message : "Could not load the latest poll results right now.",
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
      const existingVote = await findEventVoteBySessionId(sessionId);
      let savedVote = existingVote;

      if (!existingVote) {
        savedVote = {
          id: "",
          sessionId,
          option: selectedOption,
          bringBackPick: selectedOption === BRING_BACK_OPTION_ID ? bringBackPick : null,
          writeIn: trimmedWriteIn,
        };

        await createEventVote({
          sessionId,
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
      setErrorMessage(
        error instanceof Error ? error.message : "Could not cast your vote right now. Please try again in a minute.",
      );
    } finally {
      setIsSubmitting(false);
      setIsBootstrapping(false);
    }
  }

  return (
    <section id="vote" className="bg-[linear-gradient(180deg,#fffaf0_0%,#f6efde_100%)] px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-[32px] border border-[#d2c7af] bg-[radial-gradient(circle_at_top,#fffdf6_0%,#f7f1e4_55%,#f1ead9_100%)] p-6 shadow-[0_24px_70px_rgba(66,84,58,0.12)] sm:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Community poll</p>
            <h2 className="mt-3 text-3xl font-heading font-bold tracking-tight text-[#314632] sm:text-4xl">
              Help Us Decide What We Do Next
            </h2>
            <p className="mt-4 text-base leading-7 text-[#556853] sm:text-lg">
              Low-pressure vote. We read every response and use it to shape what GetLoveYVR does next.
            </p>
          </div>

          <div className="mt-8 rounded-[28px] border border-[#dad0bb] bg-white/85 p-5 shadow-[0_12px_35px_rgba(49,70,50,0.08)] sm:p-6">
            {!firebaseEnabled && (
              <div className="rounded-2xl border border-[#e3d4bf] bg-[#fff8ed] px-4 py-3 text-sm text-[#5e684e]">
                Voting comes online once Firebase and Firestore are both connected for this build.
              </div>
            )}

            {errorMessage && (
              <div
                className="mb-5 rounded-2xl border border-[#d7b0a6] bg-[#fff0eb] px-4 py-3 text-sm text-[#8b4e43]"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            {isBootstrapping ? (
              <div className="space-y-4" aria-live="polite">
                <div className="h-5 w-40 rounded-full bg-[#efe7d6]" />
                <div className="grid gap-3">
                  {POLL_OPTIONS.map((option) => (
                    <div key={option.id} className="h-20 rounded-3xl bg-[#f5efe2]" />
                  ))}
                </div>
              </div>
            ) : showResults ? (
              <div className="space-y-6" aria-live="polite">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-heading font-semibold text-[#2f4631]">
                      Here&apos;s what people are into
                    </h3>
                    <p className="mt-2 text-sm text-[#61745f]">
                      {totalVotes === 1 ? "1 vote so far." : `${totalVotes} votes so far.`}
                    </p>
                  </div>
                  {currentVoteSummary && (
                    <p className="text-sm font-medium text-[#476248]">{currentVoteSummary}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {POLL_OPTIONS.map((option, index) => {
                    const count = results[option.id] ?? 0;
                    const percentage = getVotePercentage(count, totalVotes);

                    return (
                      <div key={option.id} className="rounded-3xl border border-[#e5dcc8] bg-[#fffcf4] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-[#2f4631]">
                              {option.emoji} {option.label}
                            </p>
                            {option.description && (
                              <p className="mt-1 text-sm text-[#6d7e68]">{option.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-[#2f4631]">{percentage}%</div>
                            <div className="text-xs text-[#7b8a73]">
                              {count} vote{count === 1 ? "" : "s"}
                            </div>
                          </div>
                        </div>
                        <div
                          className="mt-3 h-3 overflow-hidden rounded-full bg-[#ebe2cf]"
                          role="progressbar"
                          aria-label={`${option.label}: ${percentage}%`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={percentage}
                        >
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#314632_0%,#567353_100%)] transition-[width] duration-700 ease-out"
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

                <div className="rounded-3xl border border-[#d8ceb7] bg-[#f8f2e3] px-4 py-4 text-sm leading-6 text-[#556853]">
                  We read every single vote. This is how we decide what&apos;s next.
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <fieldset className="space-y-4">
                  <legend className="text-lg font-heading font-semibold text-[#2f4631]">
                    What should we try next?
                  </legend>
                  <RadioGroup
                    value={selectedOption}
                    onValueChange={(value) => {
                      setSelectedOption(value as PollOptionId);
                      setErrorMessage("");
                    }}
                    className="gap-3"
                  >
                    {POLL_OPTIONS.map((option) => {
                      const inputId = `poll-option-${option.id}`;

                      return (
                        <div
                          key={option.id}
                          className="rounded-3xl border border-[#e2d8c2] bg-[#fffdf7] p-4 transition-colors hover:border-[#b5c2a9] hover:bg-[#fcf7eb]"
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              id={inputId}
                              value={option.id}
                              className="mt-1 border-[#476248] text-[#476248]"
                            />
                            <Label htmlFor={inputId} className="flex-1 cursor-pointer space-y-1">
                              <div className="text-base font-medium leading-6 text-[#2f4631]">
                                {option.emoji} {option.label}
                              </div>
                              {option.description && (
                                <p className="text-sm leading-6 text-[#6d7e68]">{option.description}</p>
                              )}
                            </Label>
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </fieldset>

                {bringBackSelected && (
                  <fieldset className="space-y-4 rounded-3xl border border-[#dfd4bd] bg-[#faf5e8] p-4">
                    <legend className="px-1 text-base font-heading font-semibold text-[#2f4631]">
                      Which one should we bring back?
                    </legend>
                    <RadioGroup
                      value={bringBackPick}
                      onValueChange={(value) => {
                        setBringBackPick(value as BringBackOptionId);
                        setErrorMessage("");
                      }}
                      className="gap-3"
                    >
                      {BRING_BACK_OPTIONS.map((option) => {
                        const inputId = `bring-back-${option.id}`;

                        return (
                          <div key={option.id} className="rounded-2xl border border-[#e2d8c2] bg-white/90 p-4">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem
                                id={inputId}
                                value={option.id}
                                className="mt-1 border-[#476248] text-[#476248]"
                              />
                              <Label
                                htmlFor={inputId}
                                className="flex-1 cursor-pointer text-base font-medium leading-6 text-[#2f4631]"
                              >
                                {option.emoji} {option.label}
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </RadioGroup>

                    <div className="space-y-2">
                      <Label htmlFor="poll-write-in" className="text-sm text-[#556853]">
                        Other thoughts or event ideas
                      </Label>
                      <Textarea
                        id="poll-write-in"
                        placeholder="Other thoughts or event ideas..."
                        value={writeIn}
                        onChange={(event) => setWriteIn(event.target.value)}
                        className="min-h-[110px] rounded-2xl border-[#d6ccb5] bg-white/95"
                      />
                    </div>
                  </fieldset>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-[#6c7b66]">
                    One vote per browser session. No pressure, just signal.
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || !firebaseEnabled}
                    className="w-full rounded-full bg-[#314632] px-8 text-[#f8f3e7] hover:bg-[#3f5a3f] sm:w-auto"
                  >
                    {isSubmitting ? "Saving..." : "Cast My Vote →"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
