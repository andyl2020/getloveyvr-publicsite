const MAILCHIMP_ACTION =
  "https://getloveyvr.us11.list-manage.com/subscribe/post?u=7b68ec6c0d93f847d04c5ffc8&id=4086845a57&f_id=005e2fe1f0";

export default function MailingListSignup() {
  return (
    <div
      id="mc_embed_shell"
      className="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-[#F5F0E8] p-5 text-[#2D4A3E] shadow-[0_24px_60px_rgba(18,32,27,0.18)] sm:p-6"
    >
      <div id="mc_embed_signup">
        <form
          action={MAILCHIMP_ACTION}
          method="post"
          id="mc-embedded-subscribe-form"
          name="mc-embedded-subscribe-form"
          className="validate"
          target="_blank"
        >
          <div id="mc_embed_signup_scroll" className="space-y-3">
            <label htmlFor="mce-EMAIL" className="block text-sm font-semibold text-[#2D4A3E]">
              Email Address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                name="EMAIL"
                className="required email h-12 w-full rounded-full border border-[#2D4A3E]/14 bg-white px-5 text-base text-[#2D4A3E] outline-none transition focus:border-[#2D4A3E]/35 focus:ring-4 focus:ring-[#2D4A3E]/10"
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
                className="h-12 rounded-full border-0 bg-[#2D4A3E] px-6 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#243c33] focus:outline-none focus:ring-4 focus:ring-[#2D4A3E]/20"
                value="Join the List"
              />
            </div>

            <p className="text-sm text-[#2D4A3E]/68">No spam. Unsubscribe anytime.</p>

            <div id="mce-responses" className="hidden">
              <div className="response" id="mce-error-response" />
              <div className="response" id="mce-success-response" />
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
