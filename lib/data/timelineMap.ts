import { TimelineEvent } from "@/components/timeline/Timeline";
import {
  spaceExplorationTimeline,
  musicEvolutionTimeline,
  medicalBreakthroughsTimeline,
  fashionThroughAgesTimeline,
  computingRevolutionTimeline,
  sportsHistoryTimeline,
  artMovementsTimeline,
  environmentalHistoryTimeline,
  foodEvolutionTimeline,
  communicationTechnologyTimeline,
  architectureTimeline,
  transportationEvolutionTimeline,
} from "./mockTimelines";
import { carTimelineEvents, ukWarsTimeline } from "./timelineData";

export interface TimelineInfo {
  id: string;
  title: string;
  creator: string;
  views: string;
  category: string;
  avatar: string;
  events: TimelineEvent[];
  pixelsPerYear?: number;
}

export const timelineMap: Record<string, TimelineInfo> = {
  "auto-history": {
    id: "auto-history",
    title: "Automotive History",
    creator: "CarEnthusiast",
    views: "12.4k",
    category: "Technology",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CarEnthusiast",
    events: carTimelineEvents,
    pixelsPerYear: 30,
  },
  "space-exploration": {
    id: "space-exploration",
    title: "Space Exploration Milestones",
    creator: "AstroNerd",
    views: "8.9k",
    category: "Science",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AstroNerd",
    events: spaceExplorationTimeline,
    pixelsPerYear: 20,
  },
  "music-evolution": {
    id: "music-evolution",
    title: "Evolution of Music Genres",
    creator: "MusicLover",
    views: "6.2k",
    category: "Culture",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MusicLover",
    events: musicEvolutionTimeline,
    pixelsPerYear: 25,
  },
  "medical-breakthroughs": {
    id: "medical-breakthroughs",
    title: "Medical Breakthroughs",
    creator: "HealthPro",
    views: "3.8k",
    category: "Science",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=HealthPro",
    events: medicalBreakthroughsTimeline,
    pixelsPerYear: 15,
  },
  "fashion-ages": {
    id: "fashion-ages",
    title: "Fashion Through the Ages",
    creator: "StyleIcon",
    views: "4.3k",
    category: "Culture",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=StyleIcon",
    events: fashionThroughAgesTimeline,
    pixelsPerYear: 20,
  },
  "computing-revolution": {
    id: "computing-revolution",
    title: "Computing Revolution",
    creator: "TechGuru",
    views: "5.1k",
    category: "Technology",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TechGuru",
    events: computingRevolutionTimeline,
    pixelsPerYear: 25,
  },
  "sports-history": {
    id: "sports-history",
    title: "Sports Legends & Records",
    creator: "SportsFan",
    views: "9.8k",
    category: "Sports",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SportsFan",
    events: sportsHistoryTimeline,
    pixelsPerYear: 20,
  },
  "art-movements": {
    id: "art-movements",
    title: "Lives of Great Artists",
    creator: "ArtLover",
    views: "4.9k",
    category: "Art",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArtLover",
    events: artMovementsTimeline,
    pixelsPerYear: 15,
  },
  "environmental-history": {
    id: "environmental-history",
    title: "Environmental Movement",
    creator: "EcoWarrior",
    views: "3.5k",
    category: "Science",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=EcoWarrior",
    events: environmentalHistoryTimeline,
    pixelsPerYear: 20,
  },
  "food-evolution": {
    id: "food-evolution",
    title: "Food & Cuisine Evolution",
    creator: "Foodie",
    views: "5.8k",
    category: "Culture",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Foodie",
    events: foodEvolutionTimeline,
    pixelsPerYear: 20,
  },
  "communication-technology": {
    id: "communication-technology",
    title: "Communication Technology",
    creator: "Innovator",
    views: "10.1k",
    category: "Technology",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Innovator",
    events: communicationTechnologyTimeline,
    pixelsPerYear: 25,
  },
  "architecture": {
    id: "architecture",
    title: "Architecture & Building",
    creator: "Architect",
    views: "6.3k",
    category: "Art",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Architect",
    events: architectureTimeline,
    pixelsPerYear: 30,
  },
  "transportation": {
    id: "transportation",
    title: "Transportation Evolution",
    creator: "Transporter",
    views: "7.2k",
    category: "Technology",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Transporter",
    events: transportationEvolutionTimeline,
    pixelsPerYear: 20,
  },
  "uk-wars": {
    id: "uk-wars",
    title: "UK Wars & Conflicts Timeline",
    creator: "HistoryBuff",
    views: "5.5k",
    category: "History",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=HistoryBuff",
    events: ukWarsTimeline,
    pixelsPerYear: 15,
  },
};

export const getAllTimelines = (): TimelineInfo[] => {
  return Object.values(timelineMap);
};

