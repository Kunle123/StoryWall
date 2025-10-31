"use client";

import Link from "next/link";
import { Folder, Plus, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xl">
            📖
          </div>
          <span className="font-display font-bold text-xl text-foreground">Timeline</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-8 w-8"
            // @ts-ignore - Type inference issue with asChild prop
            asChild
          >
            <Link href="/discover">
              <Search className="w-4 h-4" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            // @ts-ignore - Type inference issue with asChild prop
            asChild
          >
            <Link href="/portfolio">
              <Folder className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Portfolio</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            // @ts-ignore - Type inference issue with asChild prop
            asChild
          >
            <Link href="/editor">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Card</span>
            </Link>
          </Button>
          <Button
            // @ts-ignore - Type inference issue with class-variance-authority
            variant="ghost"
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="rounded-full"
            // @ts-ignore - Type inference issue with asChild prop
            asChild
          >
            <Link href="/profile">
              <User className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
