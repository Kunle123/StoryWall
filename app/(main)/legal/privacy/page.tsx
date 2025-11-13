import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | StoryWall',
  description: 'Privacy Policy for StoryWall',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            StoryWall ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, services, and applications (collectively, the "Service").
          </p>
          <p>
            This Privacy Policy complies with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Email address, username, password (hashed), and profile information</li>
            <li><strong>Content:</strong> Timelines, events, descriptions, images, and other content you create</li>
            <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store full payment card details)</li>
            <li><strong>Communications:</strong> Messages you send to us, feedback, and support requests</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Information Collected Automatically</h3>
          <p>When you use our Service, we automatically collect certain information, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Service</li>
            <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
            <li><strong>Cookies and Tracking:</strong> See our <a href="/legal/cookies" className="text-primary underline">Cookie Policy</a> for details</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Information from Third Parties</h3>
          <p>We may receive information from third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Authentication:</strong> Clerk provides authentication services and may share user information</li>
            <li><strong>Payment Processing:</strong> Stripe processes payments and may share transaction information</li>
            <li><strong>Social Media:</strong> If you sign in with social media, we may receive profile information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our Service</li>
            <li>Process transactions and manage your account</li>
            <li>Send you service-related communications</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Comply with legal obligations and enforce our Terms</li>
            <li>Analyse usage patterns to improve user experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Legal Basis for Processing (UK GDPR)</h2>
          <p>Under UK GDPR, we process your personal data based on:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Consent:</strong> When you provide explicit consent (e.g., marketing communications)</li>
            <li><strong>Contract:</strong> To perform our contract with you (providing the Service)</li>
            <li><strong>Legal Obligation:</strong> To comply with legal requirements</li>
            <li><strong>Legitimate Interests:</strong> To improve our Service, prevent fraud, and ensure security</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing and Disclosure</h2>
          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Providers:</strong> Third-party services that help us operate (e.g., Clerk, Stripe, Cloudinary, Railway)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorise us to share information</li>
          </ul>
          <p>
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide the Service and fulfil the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
          </p>
          <p>
            When you delete your account, we will delete or anonymise your personal information, except where we are required to retain it for legal or legitimate business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights (UK GDPR)</h2>
          <p>Under UK GDPR, you have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
            <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise these rights, please contact us at <a href="mailto:privacy@storywall.com" className="text-primary underline">privacy@storywall.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries outside the UK and European Economic Area (EEA). We ensure appropriate safeguards are in place, such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Standard Contractual Clauses approved by the UK Information Commissioner's Office (ICO)</li>
            <li>Adequacy decisions by the UK government</li>
            <li>Other legally recognised transfer mechanisms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Security</h2>
          <p>
            We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately at <a href="mailto:privacy@storywall.com" className="text-primary underline">privacy@storywall.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies. For detailed information, please see our <a href="/legal/cookies" className="text-primary underline">Cookie Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a notice on our website. Your continued use of the Service after such changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Information</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
          </p>
          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="font-semibold">Data Protection Officer</p>
            <p>StoryWall</p>
            <p>Email: <a href="mailto:privacy@storywall.com" className="text-primary underline">privacy@storywall.com</a></p>
          </div>
          <p>
            You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) if you believe we have not handled your personal data correctly:
          </p>
          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="font-semibold">Information Commissioner's Office</p>
            <p>Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary underline">ico.org.uk</a></p>
            <p>Phone: 0303 123 1113</p>
          </div>
        </section>
      </div>
    </div>
  );
}

