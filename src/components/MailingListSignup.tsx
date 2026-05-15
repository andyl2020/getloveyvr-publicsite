import { Mail, Sparkles } from "lucide-react";

const MAILCHIMP_ACTION =
  "https://getloveyvr.us11.list-manage.com/subscribe/post?u=7b68ec6c0d93f847d04c5ffc8&id=4086845a57&f_id=005e2fe1f0";

export default function MailingListSignup() {
  return (
    <div id="mc_embed_shell" className="rounded-[30px] bg-[#F5F0E8] p-6 text-[#2D4A3E] shadow-2xl shadow-black/10 sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2D4A3E]/10 text-[#2D4A3E]">
          <Mail className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2D4A3E]/15 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2D4A3E]/75">
            <Sparkles className="h-3.5 w-3.5" />
            Early Access List
          </div>
          <h3 className="text-2xl font-heading font-bold tracking-tight sm:text-[2rem]">
            Join the mailing list
          </h3>
          <p className="max-w-xl text-sm leading-6 text-[#2D4A3E]/72">
            Get the next event drop, early links, and the occasional last-minute opening.
            Low-pressure. Useful emails only.
          </p>
        </div>
      </div>

      <div
        id="mc_embed_signup"
        className="overflow-hidden rounded-[26px] border border-[#2D4A3E]/12 bg-white/80 p-5 shadow-[0_18px_50px_rgba(45,74,62,0.08)] sm:p-6"
      >
        <form
          action={MAILCHIMP_ACTION}
          method="post"
          id="mc-embedded-subscribe-form"
          name="mc-embedded-subscribe-form"
          className="validate"
          target="_blank"
        >
          <div id="mc_embed_signup_scroll" className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h4 className="text-xl font-heading font-semibold text-[#2D4A3E]">Stay in the loop</h4>
                <p className="mt-1 text-sm text-[#2D4A3E]/68">
                  New singles events, first dibs, and the good updates.
                </p>
              </div>
              <div className="indicates-required text-xs font-medium uppercase tracking-[0.18em] text-[#2D4A3E]/55">
                <span className="asterisk text-[#2D4A3E]">*</span> Required
              </div>
            </div>

            <div className="mc-field-group space-y-2">
              <label htmlFor="mce-EMAIL" className="block text-sm font-semibold text-[#2D4A3E]">
                Email Address <span className="asterisk text-[#2D4A3E]">*</span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  name="EMAIL"
                  className="required email h-12 w-full rounded-full border border-[#2D4A3E]/16 bg-[#F5F0E8] px-5 text-base text-[#2D4A3E] outline-none transition focus:border-[#2D4A3E]/40 focus:ring-4 focus:ring-[#2D4A3E]/10"
                  id="mce-EMAIL"
                  required
                  defaultValue=""
                  placeholder="you@domain.com"
                  autoComplete="email"
                />
                <input
                  type="submit"
                  name="subscribe"
                  id="mc-embedded-subscribe"
                  className="button h-12 rounded-full border-0 bg-[#2D4A3E] px-6 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#243c33] focus:outline-none focus:ring-4 focus:ring-[#2D4A3E]/20"
                  value="Join the List"
                />
              </div>
            </div>

            <div
              id="mce-responses"
              className="clear rounded-2xl border border-dashed border-[#2D4A3E]/12 bg-[#F5F0E8]/70 px-4 py-3 text-sm text-[#2D4A3E]/68"
            >
              <div className="response hidden" id="mce-error-response" />
              <div className="response hidden" id="mce-success-response" />
              <p>Subscribe opens a quick confirmation tab, then you’re in.</p>
            </div>

            <div aria-hidden="true" className="absolute left-[-5000px]">
              <input
                type="text"
                name="b_7b68ec6c0d93f847d04c5ffc8_4086845a57"
                tabIndex={-1}
                defaultValue=""
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
