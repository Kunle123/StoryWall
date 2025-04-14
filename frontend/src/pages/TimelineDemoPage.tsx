import React from 'react';
import styled from 'styled-components';
import { TimelineContainer } from '../components/timeline';

const PageContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: 30px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: var(--heading-color, #333);
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: var(--text-color, #555);
  max-width: 800px;
  margin: 0 auto;
`;

/**
 * Sample timeline data for demonstration purposes
 */
const sampleTimelineData = {
  title: "Human Exploration Milestones",
  description: "A timeline of pivotal moments in humanity's journey of exploration, from early sea navigation to space travel and beyond.",
  events: [
    {
      id: "1",
      title: "Magellan's Expedition",
      description: "Ferdinand Magellan led the first expedition to circumnavigate the globe, though he didn't complete the journey himself. The expedition confirmed that the Earth is round and established the need for an international date line.",
      date: new Date("1519-09-20"),
      location: "Spain to Philippines",
      category: "Maritime Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Magellan_1810_engraved_portrait.jpg",
      importance: 3
    },
    {
      id: "2",
      title: "Captain Cook's Voyages",
      description: "James Cook mapped the Pacific Ocean with unprecedented accuracy, making the first European contact with the eastern coastline of Australia and the Hawaiian Islands, and circumnavigating New Zealand.",
      date: new Date("1768-08-26"),
      location: "Pacific Ocean",
      category: "Maritime Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/76/Captainjamescookportrait.jpg",
      importance: 3
    },
    {
      id: "3",
      title: "Lewis and Clark Expedition",
      description: "Meriwether Lewis and William Clark led an expedition across the western portion of the United States, mapping the territory, establishing trade with Native Americans, and finding a route to the Pacific Ocean.",
      date: new Date("1804-05-14"),
      location: "United States",
      category: "Land Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/50/Lewis_and_Clark_Expedition.jpg",
      importance: 3
    },
    {
      id: "4",
      title: "Wright Brothers' First Flight",
      description: "Orville and Wilbur Wright made the first controlled, sustained flight of a powered, heavier-than-air aircraft, flying 120 feet in 12 seconds at Kitty Hawk, North Carolina.",
      date: new Date("1903-12-17"),
      location: "Kitty Hawk, North Carolina",
      category: "Aviation",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e1/First_flight2.jpg",
      videoUrl: "https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/A_Shot_at_Dawn.ogv/A_Shot_at_Dawn.ogv.360p.vp9.webm",
      importance: 4
    },
    {
      id: "5",
      title: "Amundsen Reaches South Pole",
      description: "Roald Amundsen and his team became the first to reach the South Pole, beating Robert Falcon Scott's British expedition by a month.",
      date: new Date("1911-12-14"),
      location: "Antarctica",
      category: "Polar Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Amundsen_in_fur_skins.jpg",
      importance: 3
    },
    {
      id: "6",
      title: "Amelia Earhart's Solo Atlantic Flight",
      description: "Amelia Earhart became the first female aviator to fly solo across the Atlantic Ocean, flying from Harbor Grace, Newfoundland to Culmore, Northern Ireland.",
      date: new Date("1932-05-20"),
      location: "Atlantic Ocean",
      category: "Aviation",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Amelia_Earhart_standing_under_nose_of_her_Lockheed_Model_10-E_Electra%2C_small.jpg",
      importance: 3
    },
    {
      id: "7",
      title: "Edmund Hillary Summits Everest",
      description: "New Zealand mountaineer Edmund Hillary and Nepalese Sherpa Tenzing Norgay became the first climbers confirmed to have reached the summit of Mount Everest, the highest mountain on Earth.",
      date: new Date("1953-05-29"),
      location: "Mount Everest, Nepal/Tibet",
      category: "Mountaineering",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/73/Edmund_Hillary_1956.jpg",
      importance: 3
    },
    {
      id: "8",
      title: "First Satellite in Orbit",
      description: "The Soviet Union launched Sputnik 1, the first artificial Earth satellite, which orbited for three weeks before its batteries died.",
      date: new Date("1957-10-04"),
      location: "Earth Orbit",
      category: "Space Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/be/Sputnik_asm.jpg",
      importance: 4
    },
    {
      id: "9",
      title: "Yuri Gagarin's Space Flight",
      description: "Soviet cosmonaut Yuri Gagarin became the first human to journey into outer space, completing one orbit of Earth aboard the Vostok 1 spacecraft.",
      date: new Date("1961-04-12"),
      location: "Earth Orbit",
      category: "Space Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/74/Yuri_Gagarin_%281961%29_-_Restoration.jpg",
      importance: 4
    },
    {
      id: "10",
      title: "Apollo 11 Moon Landing",
      description: "American astronauts Neil Armstrong and Buzz Aldrin became the first humans to land on the Moon. Armstrong was the first to step onto the lunar surface with the words, 'That's one small step for man, one giant leap for mankind.'",
      date: new Date("1969-07-20"),
      location: "Moon",
      category: "Space Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Aldrin_Apollo_11_original.jpg",
      videoUrl: "https://upload.wikimedia.org/wikipedia/commons/transcoded/8/8b/Apollo_11_Landing_Site_Approach_%28Silent%29.ogg/Apollo_11_Landing_Site_Approach_%28Silent%29.ogg.480p.webm",
      importance: 5
    },
    {
      id: "11",
      title: "Voyager 1 Launch",
      description: "NASA launched the Voyager 1 space probe to study the outer Solar System. It has since become the farthest human-made object from Earth and the first to enter interstellar space.",
      date: new Date("1977-09-05"),
      location: "Solar System",
      category: "Space Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Voyager.jpg",
      importance: 3
    },
    {
      id: "12",
      title: "First Hubble Images",
      description: "The Hubble Space Telescope, launched into low Earth orbit, began sending back unprecedented images of distant stars and galaxies, revolutionizing astronomy.",
      date: new Date("1990-05-20"),
      location: "Earth Orbit",
      category: "Space Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3f/HST-SM4.jpeg",
      importance: 3
    },
    {
      id: "13",
      title: "International Space Station",
      description: "The first module of the International Space Station was launched into orbit, beginning the construction of the largest human-made structure in space.",
      date: new Date("1998-11-20"),
      location: "Earth Orbit",
      category: "Space Exploration",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/04/International_Space_Station_after_undocking_of_STS-132.jpg",
      importance: 3
    },
    {
      id: "14",
      title: "SpaceX Falcon 9 Reusable Rocket",
      description: "SpaceX successfully landed the first stage of its Falcon 9 rocket back on Earth after launching a payload to space, demonstrating reusable rocket technology for the first time.",
      date: new Date("2015-12-22"),
      location: "Cape Canaveral, Florida",
      category: "Space Innovation",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Iridium-1_Launch_%2832312419635%29.jpg",
      videoUrl: "https://upload.wikimedia.org/wikipedia/commons/transcoded/5/59/Falcon_9_first-stage_landing_on_OCISLY_%28close-up%29.webm/Falcon_9_first-stage_landing_on_OCISLY_%28close-up%29.webm.720p.vp9.webm",
      importance: 4
    },
    {
      id: "15",
      title: "Webb Space Telescope Images",
      description: "The James Webb Space Telescope released its first full-color images, providing unprecedented views of distant galaxies and revolutionizing space observation technology.",
      date: new Date("2022-07-12"),
      location: "Space",
      category: "Space Technology",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/James_Webb_Space_Telescope_2021.jpg",
      importance: 3
    }
  ]
};

/**
 * Demo page showcasing the timeline component
 */
const TimelineDemoPage: React.FC = () => {
  return (
    <PageContainer>
      <Header>
        <Title>Timeline Visualization Demo</Title>
        <Description>
          This interactive timeline features a 300-degree circular dial (spanning from 7 o'clock to 5 o'clock) 
          combined with a synchronized horizontal zoomed view. Select any exploration milestone 
          to see it highlighted on both timelines and view detailed information below. 
          Notice how the circular timeline indicates which section is visible in the horizontal view.
        </Description>
      </Header>
      
      <TimelineContainer 
        timelineData={sampleTimelineData} 
        initialEventId="8" // Select Sputnik as initial event
      />
    </PageContainer>
  );
};

export default TimelineDemoPage; 