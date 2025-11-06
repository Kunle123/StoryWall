import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Story from "./pages/Story";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CardEditor from "./pages/CardEditor";
import Portfolio from "./pages/Portfolio";
import Discover from "./pages/Discover";
import TimelineEditor from "./pages/TimelineEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/story/:id" element={<Story />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/editor" element={<CardEditor />} />
          <Route path="/timeline-editor" element={<TimelineEditor />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
