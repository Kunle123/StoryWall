"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const StatisticsPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useUser();
  const [measurementQuestion, setMeasurementQuestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedMetrics, setSuggestedMetrics] = useState<string[]>([]);
  const [suggestedDataSource, setSuggestedDataSource] = useState("");

  // Redirect to sign-in if not authenticated
  if (isLoaded && !isSignedIn) {
    router.push('/sign-in');
    return null;
  }

  if (!isLoaded) {
    return null;
  }

  const handleGenerateSuggestions = async () => {
    if (!measurementQuestion.trim()) {
      toast({
        title: "Missing Question",
        description: "Please enter what you want to measure.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-statistics-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurementQuestion,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      if (data.metrics && Array.isArray(data.metrics)) {
        setSuggestedMetrics(data.metrics.slice(0, 8));
      }
      if (data.dataSource) {
        setSuggestedDataSource(data.dataSource);
      }
      
      toast({
        title: "Suggestions Generated",
        description: `Found ${data.metrics?.length || 0} metrics and data source suggestions.`,
      });
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTimeline = () => {
    if (!measurementQuestion.trim()) {
      toast({
        title: "Missing Question",
        description: "Please enter what you want to measure.",
        variant: "destructive",
      });
      return;
    }

    if (suggestedMetrics.length === 0) {
      toast({
        title: "No Metrics",
        description: "Please generate metric suggestions first.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to editor with statistics data
    const params = new URLSearchParams({
      title: measurementQuestion.trim(),
      description: `Statistical analysis of ${measurementQuestion.trim()}`,
      type: 'statistics',
      fields: suggestedMetrics.join('|'),
      dataSource: suggestedDataSource || 'AI Suggested',
    });

    router.push(`/editor?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />
      <main className="container mx-auto px-4 pt-16 pb-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">Create Statistics Timeline</h1>
          <p className="text-sm text-muted-foreground">
            Tell us what you want to measure, and we'll help you build a statistical timeline with the right metrics and data sources.
          </p>
        </div>

        {/* Measurement Question */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="measurement-question" className="text-[15px]">What do you want to measure? *</Label>
              <p className="text-xs text-muted-foreground">
                Describe what you want to track statistically (e.g., "Crime in West Midlands", "UK Political Party Polling", "Car Production in UK").
              </p>
              <Textarea
                id="measurement-question"
                placeholder="e.g., Crime in West Midlands"
                value={measurementQuestion}
                onChange={(e) => setMeasurementQuestion(e.target.value)}
                className="min-h-[100px] resize-none"
                rows={3}
              />
            </div>
            
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isGenerating || !measurementQuestion.trim()}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing and finding data sources...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Metrics & Find Data Sources
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Suggested Metrics and Data Source */}
        {suggestedMetrics.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-bold font-display mb-4">Suggested Metrics</h3>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted-foreground">
                Based on your question, here are the metrics we found:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <span className="text-sm">{metric}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {suggestedDataSource && (
              <div className="space-y-2">
                <Label className="text-[15px]">Suggested Data Source</Label>
                <p className="text-sm text-muted-foreground">{suggestedDataSource}</p>
              </div>
            )}
          </Card>
        )}

        {/* Create Button */}
        {suggestedMetrics.length > 0 && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-6 pb-6 mt-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg font-display mb-1">Ready to Create</h3>
                  <p className="text-sm text-muted-foreground">
                    {measurementQuestion || 'Statistics Timeline'}
                  </p>
                </div>
                <Button
                  onClick={handleCreateTimeline}
                  size="lg"
                  className="gap-2"
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

export default StatisticsPage;

