"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
  id: string;
  clerk_id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

const Settings = () => {
  const router = useRouter();
  const { isSignedIn, user: clerkUser } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadProfile() {
      if (!isSignedIn) {
        router.push("/auth");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setUsername(data.username);
          setBio(data.bio || "");
          setAvatarUrl(data.avatar_url);
          setPreviewUrl(data.avatar_url || clerkUser?.imageUrl);
        } else {
          toast({
            title: "Error",
            description: "Failed to load profile",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Failed to load profile:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [isSignedIn, router, toast, clerkUser?.imageUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setAvatarUrl(data.url);
      setPreviewUrl(data.url);
      
      toast({
        title: "Image uploaded",
        description: "Profile picture updated successfully",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      setPreviewUrl(avatarUrl || clerkUser?.imageUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast({
        title: "Invalid username",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          avatar_url: avatarUrl,
          bio: bio.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const data = await response.json();
      setProfile(data);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    setPreviewUrl(clerkUser?.imageUrl);
  };

  if (!isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/profile")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {/* Profile Picture Section */}
          <div className="space-y-4 mb-8">
            <Label className="text-base font-semibold">Profile Picture</Label>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={previewUrl} alt={username || "Profile"} />
                <AvatarFallback className="text-2xl">
                  {username?.charAt(0).toUpperCase() || "👤"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  JPEG, PNG, GIF, or WebP. Max 10MB.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Username Section */}
          <div className="space-y-4 mb-8">
            <Label htmlFor="username" className="text-base font-semibold">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={50}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              Letters, numbers, underscores, and hyphens only. 50 characters max.
            </p>
          </div>

          {/* Bio Section */}
          <div className="space-y-4 mb-8">
            <Label htmlFor="bio" className="text-base font-semibold">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself... (optional)"
              maxLength={500}
              rows={4}
              className="max-w-md resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {bio.length}/500 characters. This will be displayed on your profile and timelines.
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-4 mb-8">
            <Label className="text-base font-semibold">Email</Label>
            <Input
              value={profile?.email || clerkUser?.emailAddresses[0]?.emailAddress || ""}
              disabled
              className="max-w-md bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed from here. Update it in your account settings.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/profile")}
              disabled={saving || uploading}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Settings;

