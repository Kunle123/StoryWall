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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Plus, X } from "lucide-react";
import { STATISTICS_TEMPLATES, CHART_TYPES, CATEGORY_COLORS, ChartType, StatisticsTemplate } from "@/lib/data/statisticsTemplates";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const StatisticsPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useUser();
  const [selectedTemplate, setSelectedTemplate] = useState<StatisticsTemplate | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [dataFields, setDataFields] = useState<string[]>([""]);
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);
  const [dataSource, setDataSource] = useState("");

  // Redirect to sign-in if not authenticated
  if (isLoaded && !isSignedIn) {
    router.push('/sign-in');
    return null;
  }

  if (!isLoaded) {
    return null;
  }

  const handleTemplateSelect = (template: StatisticsTemplate | 'custom') => {
    if (template === 'custom') {
      setShowCustom(true);
      setSelectedTemplate(null);
      setDataFields([""]);
      setSelectedChartType(null);
    } else {
      setShowCustom(false);
      setSelectedTemplate(template);
      setDataFields(template.exampleFields.map(field => field));
      setSelectedChartType(template.suggestedChartTypes[0] || null);
    }
  };

  const handleAddField = () => {
    setDataFields([...dataFields, ""]);
  };

  const handleRemoveField = (index: number) => {
    if (dataFields.length > 1) {
      setDataFields(dataFields.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...dataFields];
    newFields[index] = value;
    setDataFields(newFields);
  };

  const handleCreateTimeline = () => {
    const fields = dataFields.filter(f => f.trim().length > 0);
    
    if (showCustom) {
      if (!customTitle.trim() || !customDescription.trim() || fields.length === 0) {
        toast({
          title: "Missing Information",
          description: "Please provide a title, description, at least one data field, and select a chart type.",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedTemplate) {
      if (fields.length === 0 || !selectedChartType) {
        toast({
          title: "Missing Information",
          description: "Please ensure all data fields are filled and a chart type is selected.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!dataSource.trim()) {
      toast({
        title: "Missing Data Source",
        description: "Please provide a source for the data (e.g., Office for National Statistics, UK Parliament, etc.).",
        variant: "destructive",
      });
      return;
    }

    // Navigate to editor with statistics data
    const params = new URLSearchParams({
      title: showCustom ? customTitle.trim() : selectedTemplate!.title,
      description: showCustom ? customDescription.trim() : selectedTemplate!.description,
      type: 'statistics',
      fields: fields.join('|'),
      chartType: selectedChartType || '',
      dataSource: dataSource.trim(),
    });

    router.push(`/editor?${params.toString()}`);
  };

  const filteredTemplates = STATISTICS_TEMPLATES;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />
      <main className="container mx-auto px-4 pt-16 pb-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">Create Statistics Timeline</h1>
          <p className="text-sm text-muted-foreground">
            Create a timeline with statistical data visualizations. Enter the fields to collect and choose how to display the data.
          </p>
        </div>

        {/* Template Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-bold font-display mb-4">Choose a Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => {
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
                    <Badge className={CATEGORY_COLORS[template.category]}>
                      {template.category}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold font-display mb-2">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Example fields:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {template.exampleFields.slice(0, 2).map((field, idx) => (
                        <li key={idx}>{field}</li>
                      ))}
                    </ul>
                  </div>
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
              <h3 className="text-lg font-bold font-display mb-2 text-center">Create Custom Statistics</h3>
              <p className="text-sm text-muted-foreground text-center">
                Define your own statistical timeline with custom fields and data visualization.
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

        {/* Form for Selected Template or Custom */}
        {(selectedTemplate || showCustom) && (
          <div className="mb-8 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold font-display mb-4">
                {showCustom ? 'Custom Statistics Details' : `${selectedTemplate?.title} Details`}
              </h3>
              <div className="space-y-4">
                {showCustom && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="custom-title" className="text-[15px]">Timeline Title</Label>
                      <Input
                        id="custom-title"
                        placeholder="e.g., UK Housing Market Statistics 2024"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-description" className="text-[15px]">Timeline Description</Label>
                      <Textarea
                        id="custom-description"
                        placeholder="e.g., A statistical analysis of UK housing prices and costs across different regions."
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        className="min-h-[100px] resize-none"
                        rows={4}
                      />
                    </div>
                  </>
                )}

                {/* Data Fields */}
                <div className="space-y-2">
                  <Label className="text-[15px]">Data Fields to Collect</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Enter the specific statistics or data points you want to collect (e.g., "Number of MPs from each party", "Average cost of a UK home").
                  </p>
                  {dataFields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Field ${index + 1} (e.g., Number of MPs from each party)`}
                        value={field}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                        className="h-10"
                      />
                      {dataFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveField(index)}
                          className="h-10 w-10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddField}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Field
                  </Button>
                </div>

                {/* Chart Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="chart-type" className="text-[15px]">Chart Type</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Choose how the data will be visualized.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(CHART_TYPES).map(([key, chartInfo]) => {
                      const chartKey = key as ChartType;
                      const isSelected = selectedChartType === chartKey;
                      const isSuggested = selectedTemplate?.suggestedChartTypes.includes(chartKey);
                      return (
                        <Card
                          key={key}
                          className={`p-4 cursor-pointer transition-all ${
                            isSelected
                              ? 'ring-2 ring-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          } ${isSuggested && selectedTemplate ? 'border-primary/30' : ''}`}
                          onClick={() => setSelectedChartType(chartKey)}
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-2">{chartInfo.icon}</div>
                            <div className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                              {chartInfo.name}
                            </div>
                            {isSuggested && selectedTemplate && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Suggested
                              </Badge>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Data Source */}
                <div className="space-y-2">
                  <Label htmlFor="data-source" className="text-[15px]">Data Source</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Enter the source of the data (e.g., "Office for National Statistics", "UK Parliament", "NHS Digital"). This will be displayed as a subtitle on each chart.
                  </p>
                  <Input
                    id="data-source"
                    placeholder="e.g., Office for National Statistics"
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value)}
                    className="h-10"
                  />
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
                    {showCustom ? customTitle || 'Custom Statistics' : selectedTemplate?.title}
                  </p>
                </div>
                <Button
                  onClick={handleCreateTimeline}
                  size="lg"
                  className="gap-2"
                  disabled={
                    (showCustom && (!customTitle.trim() || !customDescription.trim())) ||
                    dataFields.filter(f => f.trim().length > 0).length === 0 ||
                    !selectedChartType ||
                    !dataSource.trim()
                  }
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

