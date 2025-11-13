import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | StoryWall',
  description: 'Acceptable Use Policy for StoryWall',
};

export default function AcceptableUsePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Acceptable Use Policy</h1>
      
      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            This Acceptable Use Policy ("Policy") sets out the rules and guidelines for using StoryWall's Service. By using our Service, you agree to comply with this Policy. Violations may result in suspension or termination of your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Prohibited Content</h2>
          <p>You must not create, upload, or share content that:</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Illegal Content</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violates any applicable laws or regulations</li>
            <li>Promotes illegal activities</li>
            <li>Contains illegal material or links to illegal content</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Harmful Content</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contains viruses, malware, or other harmful code</li>
            <li>Attempts to hack, disrupt, or damage our Service or other users' accounts</li>
            <li>Contains phishing attempts or scams</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Offensive Content</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contains hate speech, discrimination, or harassment</li>
            <li>Promotes violence, terrorism, or extremism</li>
            <li>Contains explicit sexual content or pornography</li>
            <li>Is defamatory, libellous, or slanderous</li>
            <li>Threatens or intimidates others</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Intellectual Property Violations</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Infringes copyright, trademark, or other intellectual property rights</li>
            <li>Uses celebrity likenesses without proper authorisation (unless qualifying as fair use, commentary, or news)</li>
            <li>Violates the right of publicity</li>
            <li>Contains pirated or unauthorised copies of copyrighted material</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.5 Misleading Content</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contains false or misleading information presented as fact</li>
            <li>Impersonates individuals, organisations, or entities</li>
            <li>Misrepresents your identity or affiliation</li>
            <li>Contains deepfakes or manipulated media used to deceive</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Prohibited Activities</h2>
          <p>You must not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
            <li>Attempt to gain unauthorised access to accounts, systems, or data</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Use the Service to send spam, unsolicited messages, or bulk communications</li>
            <li>Create multiple accounts to circumvent restrictions or bans</li>
            <li>Share your account credentials with others</li>
            <li>Use the Service for commercial purposes that violate our Terms</li>
            <li>Collect or harvest user information without consent</li>
            <li>Engage in any activity that could harm our reputation or business</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. AI-Generated Content Guidelines</h2>
          <p>
            When using AI-generated content, you must:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Review and verify AI-generated content for accuracy before publishing</li>
            <li>Not rely solely on AI-generated content for critical decisions</li>
            <li>Clearly indicate when content is AI-generated if required by law or context</li>
            <li>Ensure AI-generated content complies with all other provisions of this Policy</li>
            <li>Not use AI to generate content that violates this Policy</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Reporting Violations</h2>
          <p>
            If you encounter content or behaviour that violates this Policy, please report it to us at:
          </p>
          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="font-semibold">Content Moderation</p>
            <p>StoryWall</p>
            <p>Email: <a href="mailto:moderation@storywall.com" className="text-primary underline">moderation@storywall.com</a></p>
          </div>
          <p>
            Please include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>A description of the violation</li>
            <li>The URL or identifier of the content</li>
            <li>Any relevant evidence or screenshots</li>
            <li>Your contact information (optional, but helpful for follow-up)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Enforcement</h2>
          <p>
            We reserve the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Review any content for compliance with this Policy</li>
            <li>Remove or disable access to content that violates this Policy</li>
            <li>Suspend or terminate accounts that violate this Policy</li>
            <li>Report illegal activity to law enforcement</li>
            <li>Take legal action against violators</li>
          </ul>
          <p>
            We may take action without prior notice, especially in cases of serious violations or illegal activity.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Appeals</h2>
          <p>
            If you believe your content was removed or your account was suspended in error, you may appeal by contacting us at <a href="mailto:appeals@storywall.com" className="text-primary underline">appeals@storywall.com</a>.
          </p>
          <p>
            Please include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your account username or email</li>
            <li>A description of the action taken</li>
            <li>Why you believe the action was in error</li>
            <li>Any relevant evidence or context</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Changes to This Policy</h2>
          <p>
            We may update this Acceptable Use Policy from time to time. We will notify users of material changes by email or through a notice on our website. Your continued use of the Service after such changes constitutes acceptance of the updated Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Information</h2>
          <p>
            If you have questions about this Policy, please contact us at:
          </p>
          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="font-semibold">StoryWall</p>
            <p>Email: <a href="mailto:legal@storywall.com" className="text-primary underline">legal@storywall.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}

