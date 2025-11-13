import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | StoryWall',
  description: 'Cookie Policy for StoryWall',
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
      
      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Cookies</h2>
          <p>
            StoryWall uses cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Keep you signed in and maintain your session</li>
            <li>Remember your preferences and settings</li>
            <li>Analyse how you use our Service to improve it</li>
            <li>Provide personalised content and features</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Types of Cookies We Use</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Essential Cookies</h3>
          <p>
            These cookies are necessary for the Service to function and cannot be switched off. They include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Authentication Cookies:</strong> Maintain your login session (provided by Clerk)</li>
            <li><strong>Security Cookies:</strong> Protect against fraud and unauthorised access</li>
            <li><strong>Session Cookies:</strong> Remember your actions during a session</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Functional Cookies</h3>
          <p>
            These cookies enable enhanced functionality and personalisation:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Preference Cookies:</strong> Remember your settings (theme, language, etc.)</li>
            <li><strong>Local Storage:</strong> Store timeline editor state and draft content</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Analytics Cookies</h3>
          <p>
            These cookies help us understand how visitors use our Service:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage Analytics:</strong> Track page views, features used, and user interactions</li>
            <li><strong>Performance Monitoring:</strong> Identify technical issues and improve performance</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Note: We may use analytics services that set their own cookies. Please check their privacy policies for details.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Cookies</h2>
          <p>
            Some cookies are set by third-party services we use:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Clerk:</strong> Authentication and user management</li>
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>Cloudinary:</strong> Image hosting and optimisation</li>
            <li><strong>Railway:</strong> Hosting and infrastructure</li>
          </ul>
          <p>
            These third parties may set their own cookies. We recommend reviewing their privacy policies:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Clerk Privacy Policy</a></li>
            <li><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Stripe Privacy Policy</a></li>
            <li><a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Cloudinary Privacy Policy</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Managing Cookies</h2>
          <p>
            You can control and manage cookies in several ways:
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Browser Settings</h3>
          <p>
            Most browsers allow you to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>See what cookies you have and delete them individually</li>
            <li>Block third-party cookies</li>
            <li>Block all cookies from specific sites</li>
            <li>Block all cookies</li>
            <li>Delete all cookies when you close your browser</li>
          </ul>
          <p>
            Please note that blocking essential cookies may affect your ability to use the Service.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Browser-Specific Instructions</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
            <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookie Consent</h2>
          <p>
            When you first visit our Service, we may ask for your consent to use non-essential cookies. You can withdraw your consent at any time by adjusting your browser settings or contacting us.
          </p>
          <p>
            Essential cookies do not require consent as they are necessary for the Service to function.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. We will notify you of material changes by updating the "Last updated" date at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Information</h2>
          <p>
            If you have questions about our use of cookies, please contact us at:
          </p>
          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="font-semibold">StoryWall</p>
            <p>Email: <a href="mailto:privacy@storywall.com" className="text-primary underline">privacy@storywall.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}

