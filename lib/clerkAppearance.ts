import { dark } from "@clerk/themes";
import type { Appearance } from "@clerk/types";

const primary = "hsl(12 88% 60%)";
const primaryFg = "#ffffff";

/** Shared Clerk UI: readable text and inputs on light + dark StoryWall backgrounds. */
export function storyWallClerkAppearance(isDark: boolean): Appearance {
  return {
    baseTheme: isDark ? dark : undefined,
    variables: {
      colorPrimary: primary,
      colorPrimaryForeground: primaryFg,
      ...(isDark
        ? {
            colorForeground: "hsl(0 0% 98%)",
            colorMutedForeground: "hsl(0 0% 72%)",
            colorInput: "hsl(0 0% 14%)",
            colorInputForeground: "hsl(0 0% 98%)",
            colorBorder: "hsl(0 0% 32%)",
            colorRing: primary,
          }
        : {
            colorForeground: "hsl(20 15% 15%)",
            colorMutedForeground: "hsl(20 10% 42%)",
            colorInput: "hsl(0 0% 100%)",
            colorInputForeground: "hsl(20 15% 15%)",
            colorBorder: "hsl(35 20% 82%)",
            colorRing: primary,
          }),
    },
    elements: {
      rootBox: "w-full",
      card: "shadow-none bg-transparent",
      headerTitle: "text-foreground font-semibold tracking-tight",
      headerSubtitle: "text-muted-foreground",
      formHeaderTitle: "text-foreground font-semibold",
      formHeaderSubtitle: "text-muted-foreground",
      formButtonPrimary:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      formFieldInput:
        "bg-background border-2 border-border text-foreground " +
        "placeholder:text-muted-foreground " +
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:outline-none",
      formFieldLabel: "text-foreground font-medium",
      socialButtonsBlockButton:
        "border-2 border-border bg-background text-foreground hover:bg-accent",
      socialButtonsBlockButtonText: "text-foreground",
      formFieldInputShowPasswordButton:
        "text-muted-foreground hover:text-foreground",
      footerActionLink: "text-primary hover:text-primary/80",
      identityPreviewText: "text-foreground",
      identityPreviewEditButton: "text-primary hover:text-primary/80",
    },
  };
}
