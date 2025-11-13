import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | StoryWall',
  description: 'Terms and Conditions for StoryWall',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
      
      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to StoryWall ("we," "our," or "us"). These Terms & Conditions ("Terms") govern your access to and use of our website, services, and applications (collectively, the "Service") operated by StoryWall, a company registered in the United Kingdom.
          </p>
          <p>
            By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Acceptance of Terms</h2>
          <p>
            By creating an account, accessing, or using StoryWall, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Registration</h2>
          <p>
            To use certain features of our Service, you must register for an account. You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and update your account information to keep it accurate</li>
            <li>Maintain the security of your password and account</li>
            <li>Accept responsibility for all activities that occur under your account</li>
            <li>Notify us immediately of any unauthorised use of your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Content and Intellectual Property</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Your Content</h3>
          <p>
            You retain ownership of any content you create, upload, or submit to StoryWall ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and distribute your User Content solely for the purpose of operating and providing the Service.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 AI-Generated Content</h3>
          <p>
            StoryWall uses artificial intelligence to generate timelines, descriptions, and images. You acknowledge that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>AI-generated content may not always be accurate or complete</li>
            <li>You are responsible for reviewing and verifying AI-generated content before publishing</li>
            <li>We do not guarantee the accuracy, completeness, or reliability of AI-generated content</li>
            <li>You should not rely solely on AI-generated content for critical decisions</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Copyright and Fair Use</h3>
          <p>
            When creating timelines about public figures, historical events, or copyrighted works, you must:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Ensure your use qualifies as fair use, commentary, criticism, or news reporting under UK copyright law</li>
            <li>Not use celebrity likenesses or copyrighted material for purely commercial purposes without permission</li>
            <li>Respect intellectual property rights and the right of publicity</li>
            <li>Include appropriate attribution where required</li>
          </ul>
          <p>
            We reserve the right to remove content that we believe infringes copyright or violates the right of publicity.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others, including intellectual property rights</li>
            <li>Upload or transmit any harmful, offensive, or illegal content</li>
            <li>Impersonate any person or entity or misrepresent your affiliation</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Attempt to gain unauthorised access to any part of the Service</li>
            <li>Use automated systems to access the Service without permission</li>
            <li>Create timelines that promote hate speech, violence, or illegal activities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Credits and Payments</h2>
          <p>
            StoryWall operates on a credit-based system. Credits are required to generate images and use certain premium features.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>New users receive 30 free credits upon registration</li>
            <li>Credits can be purchased through our payment system</li>
            <li>Credits are non-refundable except as required by law</li>
            <li>Credit packages and pricing are subject to change with notice</li>
            <li>Unused credits do not expire</li>
          </ul>
          <p>
            All payments are processed securely through Stripe. By making a purchase, you agree to Stripe's terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Content Moderation and Removal</h2>
          <p>
            We reserve the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Review, moderate, or remove any content that violates these Terms</li>
            <li>Suspend or terminate accounts that violate these Terms</li>
            <li>Respond to valid takedown requests under the Digital Millennium Copyright Act (DMCA) or UK equivalent</li>
            <li>Remove content that infringes copyright or violates the right of publicity</li>
          </ul>
          <p>
            If you believe your content was removed in error, please contact us at <a href="mailto:legal@storywall.com" className="text-primary underline">legal@storywall.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. DMCA and Copyright Takedown Requests</h2>
          <p>
            If you believe that content on StoryWall infringes your copyright, please send a takedown request to:
          </p>
          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="font-semibold">Copyright Agent</p>
            <p>StoryWall</p>
            <p>Email: <a href="mailto:copyright@storywall.com" className="text-primary underline">copyright@storywall.com</a></p>
          </div>
          <p>
            Your takedown request must include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Identification of the copyrighted work claimed to have been infringed</li>
            <li>Identification of the material that is claimed to be infringing</li>
            <li>Your contact information</li>
            <li>A statement that you have a good faith belief that the use is not authorised</li>
            <li>A statement that the information is accurate and you are authorised to act on behalf of the copyright owner</li>
            <li>Your physical or electronic signature</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Disclaimers and Limitation of Liability</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
          </p>
          <p>
            Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded or limited under UK law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless StoryWall, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Your User Content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including if you breach these Terms.
          </p>
          <p>
            Upon termination, your right to use the Service will cease immediately. You may terminate your account at any time by contacting us at <a href="mailto:support@storywall.com" className="text-primary underline">support@storywall.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of material changes by email or through a notice on our website. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="font-semibold">StoryWall</p>
            <p>Email: <a href="mailto:legal@storywall.com" className="text-primary underline">legal@storywall.com</a></p>
            <p>Support: <a href="mailto:support@storywall.com" className="text-primary underline">support@storywall.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}

