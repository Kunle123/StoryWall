'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AcceptTermsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in?redirect=/legal/accept-terms');
    }
  }, [isLoaded, user, router]);

  const handleAccept = async () => {
    if (!termsChecked || !privacyChecked) {
      toast({
        title: "Please accept all terms",
        description: "You must accept both the Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    setAccepting(true);
    try {
      const response = await fetch('/api/user/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept terms');
      }

      toast({
        title: "Terms accepted",
        description: "Thank you for accepting our Terms of Service and Privacy Policy.",
      });

      // Redirect to home page or return URL
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/';
      router.push(returnUrl);
    } catch (error: any) {
      console.error('Error accepting terms:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept terms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-display">Accept Terms & Conditions</h1>
          <p className="text-muted-foreground">
            Please review and accept our Terms of Service and Privacy Policy to continue using StoryWall.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="terms"
              checked={termsChecked}
              onCheckedChange={(checked) => setTermsChecked(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label htmlFor="terms" className="text-base font-semibold cursor-pointer">
                I accept the Terms of Service
              </Label>
              <p className="text-sm text-muted-foreground">
                I have read and agree to the{' '}
                <Link href="/legal/terms" target="_blank" className="text-primary underline hover:text-primary/80">
                  Terms of Service
                </Link>
                {' '}and understand my rights and obligations.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="privacy"
              checked={privacyChecked}
              onCheckedChange={(checked) => setPrivacyChecked(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label htmlFor="privacy" className="text-base font-semibold cursor-pointer">
                I accept the Privacy Policy
              </Label>
              <p className="text-sm text-muted-foreground">
                I have read and agree to the{' '}
                <Link href="/legal/privacy" target="_blank" className="text-primary underline hover:text-primary/80">
                  Privacy Policy
                </Link>
                {' '}and understand how my data will be used.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleAccept}
            disabled={!termsChecked || !privacyChecked || accepting}
            className="flex-1"
            size="lg"
          >
            {accepting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept & Continue'
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By clicking "Accept & Continue", you acknowledge that you have read, understood, and agree to be bound by our Terms of Service and Privacy Policy.
        </p>
      </Card>
    </div>
  );
}




