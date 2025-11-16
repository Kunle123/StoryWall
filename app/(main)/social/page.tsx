"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import { SOCIAL_TEMPLATES, PLATFORM_INFO, SocialPlatform, SocialTemplate } from "@/lib/data/socialTemplates";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const SocialTimelinePage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useUser();
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SocialTemplate | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  // Redirect to sign-in if not authenticated
  if (isLoaded && !isSignedIn) {
    router.push('/sign-in');
    return null;
  }

  if (!isLoaded) {
    return null;
  }

  const handleTemplateSelect = (template: SocialTemplate | 'custom') => {
    if (template === 'custom') {
      setShowCustom(true);
      setSelectedTemplate(null);
    } else {
      setShowCustom(false);
      setSelectedTemplate(template);
    }
  };

  const handleCreateTimeline = () => {
    if (showCustom) {
      if (!customTitle.trim() || !customDescription.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide both a title and description for your custom timeline.",
          variant: "destructive",
        });
        return;
      }

      // Navigate to editor with custom data
      const params = new URLSearchParams({
        title: customTitle.trim(),
        description: customDescription.trim(),
        source: `${selectedPlatform}:custom`,
        platform: selectedPlatform || '',
      });

      router.push(`/editor?${params.toString()}`);
    } else if (selectedTemplate) {
      // Navigate to editor with pre-filled template data
      const params = new URLSearchParams({
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        source: `${selectedTemplate.platform}:${selectedTemplate.id}`,
        platform: selectedTemplate.platform,
      });

      router.push(`/editor?${params.toString()}`);
    }
  };

  const platforms: SocialPlatform[] = ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube'];
  const templates = selectedPlatform ? SOCIAL_TEMPLATES[selectedPlatform] : [];

  const categoryColors: Record<string, string> = {
    engagement: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    seasonal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    career: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    content: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />
      <main className="container mx-auto px-4 pt-16 pb-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">Create Social Media Timeline</h1>
          <p className="text-sm text-muted-foreground">
            Choose a social media platform and template to automatically generate a timeline from your social media content.
          </p>
        </div>

        {/* Platform Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-bold font-display mb-4">Select Platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {platforms.map((platform) => {
              const info = PLATFORM_INFO[platform];
              const isSelected = selectedPlatform === platform;
              return (
                <Card
                  key={platform}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    isSelected
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setSelectedPlatform(platform);
                    setSelectedTemplate(null);
                    setShowCustom(false);
                  }}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{info.icon}</div>
                    <div className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                      {info.name}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Template Selection */}
        {selectedPlatform && (
          <div className="mb-8">
            <h2 className="text-lg font-bold font-display mb-4">
              Choose a Template for {PLATFORM_INFO[selectedPlatform].name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <Card
                    key={template.id}
                    className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                      isSelected
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{template.icon}</div>
                      <Badge className={categoryColors[template.category]}>
                        {template.category}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold font-display mb-2">{template.title}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    {isSelected && (
                      <div className="mt-4 flex items-center text-primary">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    )}
                  </Card>
                );
              })}
              
              {/* Custom Template Option */}
              <Card
                className={`p-6 cursor-pointer transition-all hover:shadow-lg border-dashed ${
                  showCustom
                    ? 'ring-2 ring-primary bg-primary/5 border-primary'
                    : 'hover:bg-muted/50 border-2'
                }`}
                onClick={() => handleTemplateSelect('custom')}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="text-3xl">✨</div>
                </div>
                <h3 className="text-lg font-bold font-display mb-2 text-center">Create Custom Timeline</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Define your own title and description for a personalized social media timeline.
                </p>
                {showCustom && (
                  <div className="mt-4 flex items-center justify-center text-primary">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Custom Template Form */}
        {showCustom && selectedPlatform && (
          <div className="mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-bold font-display mb-4">Custom Timeline Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-title" className="text-[15px]">Timeline Title</Label>
                  <Input
                    id="custom-title"
                    placeholder="e.g., Most Disliked Tweets from BBC"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a descriptive title for your timeline. You can reference specific accounts using [Account] placeholder.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-description" className="text-[15px]">Timeline Description</Label>
                  <Textarea
                    id="custom-description"
                    placeholder="e.g., A timeline of the most controversial or disliked tweets from BBC, organized chronologically to show patterns and public reaction."
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what this timeline will contain and how it will be organized.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Create Button */}
        {(selectedTemplate || showCustom) && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-6 pb-6 mt-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg font-display mb-1">Ready to Create</h3>
                  <p className="text-sm text-muted-foreground">
                    {showCustom ? customTitle || 'Custom Timeline' : selectedTemplate?.title}
                  </p>
                </div>
                <Button
                  onClick={handleCreateTimeline}
                  size="lg"
                  className="gap-2"
                  disabled={showCustom && (!customTitle.trim() || !customDescription.trim())}
                >
                  Create Timeline
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default SocialTimelinePage;

