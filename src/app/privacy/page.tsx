import Link from "next/link";
import { LegalPage, contactLine } from "@/components/LegalPage";

export const metadata = { title: "Privacy", description: "What VibeCheck stores, who can see it, and how to delete it." };

export default function Privacy() {
  return (
    <LegalPage title="Privacy">
      <section>
        <p>This page describes what the VibeCheck code actually does with data. It is written plainly rather than by a lawyer.</p>
      </section>
      <section>
        <h2>What we store</h2>
        <ul>
          <li><strong>Your account:</strong> your email address and name. Sign-in itself (passwords, email codes, Google/GitHub login) is handled by Clerk; VibeCheck never sees your password.</li>
          <li><strong>Audits:</strong> the URL, repository or file name you submit, the results of every check (including the response headers of the audited page), and two screenshots of the rendered page.</li>
          <li><strong>Uploads and repositories:</strong> files from a .zip or GitHub import are kept so an expert can review them. Real <code>.env</code> files are never stored, and <code>node_modules</code> is skipped.</li>
          <li><strong>Reviews:</strong> review requests and the notes you write, expert applications (headline, bio, links), expert reviews, and ratings.</li>
          <li><strong>Abuse protection:</strong> short-lived request counters keyed by your account or, if you are signed out, your IP address.</li>
        </ul>
      </section>
      <section>
        <h2>Who can see it</h2>
        <ul>
          <li>Audits of a live URL or a public GitHub repo can be opened by anyone who has the link. They are not listed anywhere.</li>
          <li>Audits of an uploaded .zip are private: only you, VibeCheck admins, and approved experts once you request a review.</li>
          <li>Expert profiles, review counts and ratings are public on the Experts page.</li>
          <li>A delivered review can be seen by anyone who can see the audit it belongs to.</li>
        </ul>
      </section>
      <section>
        <h2>Services that receive data</h2>
        <ul>
          <li><strong>Clerk</strong> (sign-in): your email, name, and sign-in activity.</li>
          <li><strong>Vercel</strong> (hosting) and <strong>Neon</strong> (database): everything VibeCheck stores.</li>
          <li><strong>OSV.dev</strong> (Google&rsquo;s open vulnerability database): the names and versions of packages in uploaded lockfiles, to look up known vulnerabilities.</li>
          <li><strong>GitHub</strong>: the repository name, when you import one.</li>
          <li><strong>The site you audit</strong> receives ordinary HTTP requests from our servers, identified as <code>VibeCheckAudit</code>.</li>
        </ul>
        <p>We do not sell data, run ads, or use third-party analytics or tracking cookies. The only cookies are the ones Clerk needs to keep you signed in.</p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <ul>
          <li>Uploaded files and screenshots are deleted 90 days after the audit, unless a review of it is still in progress. Audit results remain.</li>
          <li>Request counters are deleted after 24 hours.</li>
          <li>Everything else is kept until you delete your account.</li>
        </ul>
      </section>
      <section>
        <h2>Deleting your data</h2>
        <p>
          On your <Link href="/dashboard">dashboard</Link>, choose <em>Delete my account</em>. That removes your account, your uploads, review requests,
          expert profile and reviews, and your Clerk sign-in. Audits of public URLs you ran are kept without your name attached.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions or requests: {contactLine()}.</p>
      </section>
    </LegalPage>
  );
}
