import { SiteFooter } from "@/components/pages/site-footer";
import { SiteHeader } from "@/components/pages/site-header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "Privacy Policy for Nowaster - Learn how we collect, use, and protect your data.",
  title: "Privacy Policy - Nowaster",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-col min-h-screen">
        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-16">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 31, 2026
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8 p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
              <h2 className="text-2xl font-bold mb-4 text-primary">
                Our Privacy Commitment
              </h2>
              <p className="text-foreground font-medium mb-3">
                Your privacy is our top priority. Here&apos;s our commitment to
                you:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li className="text-foreground">
                  <strong>We will never sell your data.</strong> Not now, not
                  ever. Your personal information and time tracking data are
                  yours alone.
                </li>
                <li className="text-foreground">
                  <strong>We collect only what we need.</strong> We only gather
                  information necessary to provide you with our time tracking
                  service.
                </li>
                <li className="text-foreground">
                  <strong>You control your data.</strong> You can export,
                  modify, or delete your data at any time.
                </li>
                <li className="text-foreground">
                  <strong>Transparency first.</strong> We clearly explain what
                  data we collect and why, with no hidden practices.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Nowaster (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
                committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our time tracking application and
                services (the &quot;Service&quot;).
              </p>
              <p className="text-muted-foreground mb-4">
                Please read this privacy policy carefully. If you do not agree
                with the terms of this privacy policy, please do not access the
                Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Information We Collect
              </h2>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                1. Account Information
              </h3>
              <p className="text-muted-foreground mb-4">
                When you create an account via OAuth providers, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Email address</li>
                <li>Display name/username</li>
                <li>Avatar/profile picture URL (from your OAuth provider)</li>
                <li>OAuth provider identifier (Google, GitHub, or Discord)</li>
                <li>User role (user or admin)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                2. Time Tracking Data
              </h3>
              <p className="text-muted-foreground mb-4">
                To provide our core time tracking functionality, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Time tracking sessions (start time, end time, duration)</li>
                <li>Categories and tags you create to organize your time</li>
                <li>Optional descriptions and notes on your time entries</li>
                <li>Session templates you create for recurring activities</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                3. Authentication & Security Data
              </h3>
              <p className="text-muted-foreground mb-4">
                To secure your account and sessions, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  Refresh tokens (stored as encrypted hashes with expiration
                  dates)
                </li>
                <li>
                  Device information (user agent string, IP address) associated
                  with login sessions
                </li>
                <li>API tokens (if you create them for integrations)</li>
                <li>Token usage timestamps for security monitoring</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                4. Social & Sharing Features (Optional)
              </h3>
              <p className="text-muted-foreground mb-4">
                If you choose to use social features, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  Friend connections and requests (including optional
                  introduction messages)
                </li>
                <li>Activity feed events when you share completed sessions</li>
                <li>Reactions/interactions with feed events</li>
                <li>
                  Notifications related to friend requests and social
                  interactions
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                5. Preferences & Settings
              </h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  Privacy visibility settings (who can see your activity:
                  friends, groups, or public)
                </li>
                <li>
                  UI preferences (stored locally in browser cookies, such as
                  sidebar state)
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                6. Analytics & Performance Data
              </h3>
              <p className="text-muted-foreground mb-4">
                We use Vercel Analytics and Speed Insights to improve our
                service. This may collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Page views and navigation patterns</li>
                <li>Performance metrics (page load times, errors)</li>
                <li>
                  General usage statistics (aggregated and anonymized when
                  possible)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  Provide, operate, and maintain the time tracking service
                </li>
                <li>
                  Authenticate your identity and manage your account security
                </li>
                <li>
                  Store and display your time tracking data, categories, and
                  tags
                </li>
                <li>
                  Enable social features like friend connections and activity
                  sharing (if you opt in)
                </li>
                <li>
                  Send notifications about friend requests, reactions, and
                  system updates
                </li>
                <li>Improve and optimize our service performance</li>
                <li>Respond to your support requests and communications</li>
                <li>
                  Detect, prevent, and address technical issues and security
                  threats
                </li>
                <li>
                  Comply with legal obligations and enforce our Terms of Service
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Data Storage & Security
              </h2>
              <p className="text-muted-foreground mb-4">
                Your data is stored securely in a PostgreSQL database. We
                implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Encrypted storage of sensitive authentication tokens</li>
                <li>Secure HTTPS connections for all data transmission</li>
                <li>Regular security updates and monitoring</li>
                <li>Access controls limiting who can view your data</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                However, no method of transmission over the Internet or
                electronic storage is 100% secure. While we strive to protect
                your personal information, we cannot guarantee its absolute
                security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Data Sharing & Disclosure
              </h2>
              <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 p-4 mb-6">
                <p className="font-bold text-green-900 dark:text-green-100 mb-2">
                  We Never Sell Your Data
                </p>
                <p className="text-green-800 dark:text-green-200">
                  We have never sold user data to third parties, and we never
                  will. Your time tracking information, personal details, and
                  usage patterns are not for sale. Period. This is a core
                  principle of Nowaster that will not change.
                </p>
              </div>
              <p className="text-muted-foreground mb-4">
                We may share your information only in the following limited
                circumstances:
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                With Your Consent
              </h3>
              <p className="text-muted-foreground mb-4">
                When you choose to share your activity feed with friends or make
                it public, that information becomes visible according to your
                privacy settings.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                Service Providers
              </h3>
              <p className="text-muted-foreground mb-4">
                We may share data with third-party service providers who help us
                operate our service:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  OAuth providers (Google, GitHub, Discord) for authentication
                </li>
                <li>Vercel for hosting and analytics</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                Legal Requirements
              </h3>
              <p className="text-muted-foreground mb-4">
                We may disclose your information if required by law or in
                response to valid legal requests (subpoenas, court orders, etc.)
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Your Privacy Rights
              </h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  <strong>Access:</strong> Request a copy of the personal data
                  we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request corrections to inaccurate
                  or incomplete data
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account
                  and associated data
                </li>
                <li>
                  <strong>Data Portability:</strong> Request your data in a
                  structured, machine-readable format
                </li>
                <li>
                  <strong>Objection:</strong> Object to certain processing of
                  your data
                </li>
                <li>
                  <strong>Withdrawal of Consent:</strong> Withdraw consent for
                  data processing where we rely on consent
                </li>
              </ul>
              <p className="text-muted-foreground mb-4">
                To exercise these rights, please contact us using the
                information in the &quot;Contact Us&quot; section below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  <strong>Authentication:</strong> Session cookies to keep you
                  logged in
                </li>
                <li>
                  <strong>Preferences:</strong> Storing your UI preferences
                  (like sidebar state)
                </li>
                <li>
                  <strong>Analytics:</strong> Vercel analytics cookies (if
                  enabled)
                </li>
              </ul>
              <p className="text-muted-foreground mb-4">
                You can control cookies through your browser settings, but
                disabling certain cookies may limit functionality of the
                Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Third-Party Services
              </h2>
              <p className="text-muted-foreground mb-4">
                Our Service integrates with third-party OAuth providers for
                authentication:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Google OAuth</li>
                <li>GitHub OAuth</li>
                <li>Discord OAuth</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                These services have their own privacy policies. We encourage you
                to review their privacy practices:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  <Link
                    className="text-primary hover:underline"
                    href="https://policies.google.com/privacy"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Google Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-primary hover:underline"
                    href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    GitHub Privacy Statement
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-primary hover:underline"
                    href="https://discord.com/privacy"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Discord Privacy Policy
                  </Link>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your personal information for as long as your account
                is active or as needed to provide you services. When you delete
                your account, we will delete your personal data, except where we
                are required to retain it for legal compliance or legitimate
                business purposes.
              </p>
              <p className="text-muted-foreground mb-4">
                Inactive accounts may be deleted after a reasonable period of
                inactivity, with advance notice when possible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Children&apos;s Privacy
              </h2>
              <p className="text-muted-foreground mb-4">
                Our Service is not intended for children under the age of 13. We
                do not knowingly collect personal information from children
                under 13. If you become aware that a child has provided us with
                personal information, please contact us. If we discover that we
                have collected personal information from a child under 13, we
                will promptly delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                International Data Transfers
              </h2>
              <p className="text-muted-foreground mb-4">
                Your information may be transferred to and processed in
                countries other than your country of residence. These countries
                may have data protection laws that are different from the laws
                of your country. By using our Service, you consent to the
                transfer of your information to these countries.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new Privacy
                Policy on this page and updating the &quot;Last updated&quot;
                date.
              </p>
              <p className="text-muted-foreground mb-4">
                We encourage you to review this Privacy Policy periodically for
                any changes. Your continued use of the Service after changes are
                posted constitutes your acceptance of the updated Privacy
                Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions or concerns about this Privacy Policy or
                our privacy practices, please contact us:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  Via GitHub:{" "}
                  <Link
                    className="text-primary hover:underline"
                    href="https://github.com/Kobu-Labs/nowaster-web/issues"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open an issue
                  </Link>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                GDPR Compliance (EU Users)
              </h2>
              <p className="text-muted-foreground mb-4">
                If you are located in the European Economic Area (EEA), you have
                certain data protection rights under the General Data Protection
                Regulation (GDPR). We process your personal data based on the
                following legal bases:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>
                  <strong>Contract Performance:</strong> Processing necessary to
                  provide our services
                </li>
                <li>
                  <strong>Legitimate Interests:</strong> Improving our service
                  and security
                </li>
                <li>
                  <strong>Consent:</strong> For optional features like social
                  sharing
                </li>
                <li>
                  <strong>Legal Obligation:</strong> Compliance with applicable
                  laws
                </li>
              </ul>
            </section>

            <div className="mt-12 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center">
                This privacy policy is effective as of the date stated above and
                will remain in effect except with respect to any changes in its
                provisions in the future.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
