import { LegalPage, contactLine } from "@/components/LegalPage";

export const metadata = { title: "Terms", description: "The rules for using VibeCheck." };

export default function Terms() {
  return (
    <LegalPage title="Terms">
      <section>
        <p>By using VibeCheck you agree to these terms. They are written plainly rather than by a lawyer.</p>
      </section>
      <section>
        <h2>What VibeCheck is</h2>
        <p>
          An automated website audit plus written reviews from independent experts. Automated results come from documented, deterministic checks
          (see the methodology page). They measure what can be observed from outside and are not a security certification or a guarantee that a
          site is safe, accessible or fast.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>Only upload code you have the right to share with reviewers.</li>
          <li>Don&rsquo;t use VibeCheck to probe, overload or attack sites. Audits make a small number of ordinary requests, and repeated audits of the same site are rate-limited.</li>
          <li>Don&rsquo;t upload malware, or content that is illegal or that you don&rsquo;t have rights to.</li>
          <li>Don&rsquo;t harass experts or requesters, or misrepresent who you are in an expert application.</li>
        </ul>
        <p>We may remove content or suspend accounts that break these rules.</p>
      </section>
      <section>
        <h2>Expert reviews</h2>
        <p>
          Experts are independent people approved by an admin based on the work they link to. Their reviews are their own opinions. VibeCheck
          doesn&rsquo;t take payment for reviews and doesn&rsquo;t pay experts.
        </p>
      </section>
      <section>
        <h2>Your content</h2>
        <p>
          You keep ownership of what you submit. You allow VibeCheck to store it, run checks on it, and show it to the people described in the
          privacy policy, for as long as it is kept.
        </p>
      </section>
      <section>
        <h2>No warranty</h2>
        <p>
          VibeCheck is provided as is, without warranty of any kind. To the extent the law allows, we aren&rsquo;t liable for decisions made from
          audit results or reviews, or for data loss. The source code is MIT-licensed.
        </p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>We may update these terms and will change the date above when we do. Questions: {contactLine()}.</p>
      </section>
    </LegalPage>
  );
}
