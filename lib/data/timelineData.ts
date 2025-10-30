import { TimelineEvent } from "@/components/timeline/Timeline";

export const carTimelineEvents: TimelineEvent[] = [
  { id: "1", year: 1886, title: "Motorwagen", description: "Karl Benz patents the first practical automobile", category: "vehicle", image: "https://images.unsplash.com/photo-1543076659-9380cdf10613?w=800&auto=format&fit=crop" },
  { id: "2", year: 1891, title: "Industry development", description: "Panhard et Levassor begins commercial auto production", category: "industry" },
  { id: "3", year: 1896, title: "Industry development", description: "Henry Ford builds his first car, the Quadricycle", category: "industry" },
  { id: "4", year: 1903, title: "Industry development", description: "Ford Motor Company founded", category: "industry" },
  { id: "5", year: 1908, title: "Model T", description: "Ford introduces the revolutionary Model T", category: "vehicle", image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop" },
  { id: "6", year: 1913, title: "Industry development", description: "Ford perfects the assembly line", category: "industry" },
  { id: "7", year: 1914, title: "Industry development", description: "First electric traffic lights installed", category: "industry" },
  { id: "8", year: 1922, title: "Industry development", description: "First car radio introduced", category: "industry" },
  { id: "9", year: 1934, title: "Citroën Traction Avant", description: "First mass-produced front-wheel-drive car", category: "vehicle" },
  { id: "10", year: 1936, title: "Industry development", description: "First diesel-powered Mercedes-Benz car", category: "industry" },
  { id: "11", year: 1938, title: "Industry development", description: "Volkswagen Beetle enters production", category: "industry" },
  { id: "12", year: 1940, title: "Industry development", description: "First fully automatic transmission", category: "industry" },
  { id: "13", year: 1948, title: "Industry development", description: "Jaguar introduces disc brakes", category: "industry" },
  { id: "14", year: 1950, title: "Industry development", description: "Power steering becomes available", category: "industry" },
  { id: "15", year: 1955, title: "Citroën DS", description: "Revolutionary hydropneumatic suspension", category: "vehicle" },
  { id: "16", year: 1959, title: "Industry development", description: "Three-point seatbelt invented by Volvo", category: "industry" },
  { id: "17", year: 1964, title: "Ford Mustang", description: "Creates the 'pony car' class", category: "vehicle" },
  { id: "18", year: 1973, title: "Oil Crisis", description: "Global oil crisis changes industry focus", category: "crisis" },
  { id: "19", year: 1974, title: "Industry development", description: "First production car with fuel injection", category: "industry" },
  { id: "20", year: 1975, title: "Industry development", description: "Catalytic converters mandated in US", category: "industry" },
  { id: "21", year: 1981, title: "Industry development", description: "First production car with airbags (Mercedes-Benz)", category: "industry" },
  { id: "22", year: 1989, title: "Mazda Miata (MX-5)", description: "Revives the affordable roadster", category: "vehicle", image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop" },
  { id: "23", year: 1990, title: "Industry development", description: "First car with GPS navigation", category: "industry" },
  { id: "24", year: 1997, title: "Toyota Prius", description: "First mass-produced hybrid vehicle", category: "vehicle", image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop" },
  { id: "25", year: 2004, title: "Industry development", description: "Tesla Motors founded", category: "industry" },
  { id: "26", year: 2008, title: "Tesla Roadster", description: "First highway-legal electric vehicle", category: "vehicle", image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop" },
  { id: "27", year: 2012, title: "Tesla Model S", description: "Mainstream luxury electric sedan", category: "vehicle", image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop" },
  { id: "28", year: 2013, title: "Industry development", description: "Self-driving car testing begins", category: "industry" },
  { id: "29", year: 2016, title: "Industry development", description: "Tesla Autopilot released", category: "industry" },
  { id: "30", year: 2020, title: "EV Acceleration", description: "Major manufacturers commit to electric future", category: "industry" },
  { id: "31", year: 2023, title: "Industry development", description: "EVs reach 10% global market share", category: "industry" },
];

// UK Wars Timeline - Since formation of Great Britain (1707) and United Kingdom (1801)
export const ukWarsTimeline: TimelineEvent[] = [
  { 
    id: "uk-war-1", 
    year: 1707, 
    month: 5, 
    title: "War of the Spanish Succession", 
    description: "Great Britain (newly formed) continues the war against France and Spain. Battle of Almansa (1707) and campaigns in Flanders.",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-2", 
    year: 1718, 
    month: 7, 
    title: "War of the Quadruple Alliance", 
    description: "Britain joins Austria, France, and the Dutch Republic against Spain. Naval battles in the Mediterranean.",
    category: "crisis"
  },
  { 
    id: "uk-war-3", 
    year: 1740, 
    title: "War of the Austrian Succession", 
    description: "Britain supports Maria Theresa of Austria. Major battles include Dettingen (1743) and Fontenoy (1745).",
    category: "crisis"
  },
  { 
    id: "uk-war-4", 
    year: 1754, 
    title: "Seven Years' War", 
    description: "Global conflict known as the 'First World War'. Britain fights France in Europe, North America, India, and Caribbean. Victory at Plassey (1757) and Quebec (1759).",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-5", 
    year: 1775, 
    month: 4, 
    title: "American Revolutionary War", 
    description: "War of Independence against American colonies. Major defeats at Saratoga (1777) and Yorktown (1781).",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1549818222-a6f3bbbf64a4?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-6", 
    year: 1793, 
    month: 2, 
    title: "French Revolutionary Wars", 
    description: "Coalition wars against revolutionary France. Naval victories at Glorious First of June (1794) and Battle of the Nile (1798).",
    category: "crisis"
  },
  { 
    id: "uk-war-7", 
    year: 1803, 
    month: 5, 
    title: "Napoleonic Wars", 
    description: "Extended conflict with Napoleonic France. Trafalgar (1805), Peninsular War (1808-1814), Waterloo (1815).",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1518373473135-5c8f3e49b23b?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-8", 
    year: 1812, 
    month: 6, 
    title: "War of 1812", 
    description: "Conflict with United States. Battles include Bladensburg, New Orleans (1815). Ended with Treaty of Ghent.",
    category: "crisis"
  },
  { 
    id: "uk-war-9", 
    year: 1853, 
    month: 10, 
    title: "Crimean War", 
    description: "Allied with France and Ottoman Empire against Russia. Siege of Sevastopol, Charge of the Light Brigade (1854).",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-10", 
    year: 1857, 
    month: 5, 
    title: "Indian Rebellion (Sepoy Mutiny)", 
    description: "Major uprising against British rule in India. Siege of Delhi and Lucknow. Rebellion suppressed by 1858.",
    category: "crisis"
  },
  { 
    id: "uk-war-11", 
    year: 1859, 
    month: 4, 
    title: "Second Opium War", 
    description: "With France against China. Capture of Beijing and burning of Summer Palace (1860).",
    category: "crisis"
  },
  { 
    id: "uk-war-12", 
    year: 1879, 
    month: 1, 
    title: "Anglo-Zulu War", 
    description: "Conflict in Southern Africa. Disaster at Isandlwana, victory at Rorke's Drift (1879).",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1544966503-7cc531b6f3d0?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-13", 
    year: 1880, 
    month: 7, 
    title: "First Boer War", 
    description: "Conflict with South African Republic (Transvaal). British defeat at Majuba Hill (1881).",
    category: "crisis"
  },
  { 
    id: "uk-war-14", 
    year: 1899, 
    month: 10, 
    title: "Second Boer War", 
    description: "War against Boer republics. Siege of Mafeking, concentration camps. Ended 1902.",
    category: "crisis"
  },
  { 
    id: "uk-war-15", 
    year: 1914, 
    month: 8, 
    title: "World War I", 
    description: "Allied Powers vs Central Powers. Western Front (Somme, Passchendaele), Gallipoli, Jutland. 1914-1918.",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1518373473135-5c8f3e49b23b?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-16", 
    year: 1916, 
    month: 7, 
    title: "Battle of the Somme", 
    description: "One of the bloodiest battles in history. First day saw 57,470 British casualties. Lasted until November 1916.",
    category: "crisis"
  },
  { 
    id: "uk-war-17", 
    year: 1939, 
    month: 9, 
    title: "World War II", 
    description: "Allied Powers vs Axis. Dunkirk (1940), Battle of Britain (1940), El Alamein (1942), D-Day (1944). 1939-1945.",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-18", 
    year: 1940, 
    month: 7, 
    title: "Battle of Britain", 
    description: "Aerial defense against German Luftwaffe. 'Never was so much owed by so many to so few.' - Churchill",
    category: "crisis"
  },
  { 
    id: "uk-war-19", 
    year: 1950, 
    month: 6, 
    title: "Korean War", 
    description: "UK contributes forces to UN coalition. 1st Commonwealth Division. Lasted until 1953.",
    category: "crisis"
  },
  { 
    id: "uk-war-20", 
    year: 1956, 
    month: 10, 
    title: "Suez Crisis", 
    description: "Military intervention in Egypt with France and Israel. International pressure forces withdrawal.",
    category: "crisis"
  },
  { 
    id: "uk-war-21", 
    year: 1982, 
    month: 4, 
    title: "Falklands War", 
    description: "War with Argentina over Falkland Islands. Naval Task Force, Battle of Goose Green. Victory June 1982.",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1544966503-7cc531b6f3d0?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-22", 
    year: 1991, 
    month: 1, 
    title: "Gulf War", 
    description: "Operation Desert Storm. UK contributes 53,000 troops. Liberation of Kuwait from Iraq.",
    category: "crisis"
  },
  { 
    id: "uk-war-23", 
    year: 1999, 
    month: 3, 
    title: "Kosovo War", 
    description: "NATO intervention including UK forces. Aerial bombing campaign against Yugoslavia.",
    category: "crisis"
  },
  { 
    id: "uk-war-24", 
    year: 2001, 
    month: 10, 
    title: "Afghanistan War", 
    description: "UK joins US-led invasion. Operation Enduring Freedom. Longest war in modern UK history until 2021.",
    category: "crisis",
    image: "https://images.unsplash.com/photo-1518373473135-5c8f3e49b23b?w=800&auto=format&fit=crop"
  },
  { 
    id: "uk-war-25", 
    year: 2003, 
    month: 3, 
    title: "Iraq War", 
    description: "UK joins US-led coalition. Invasion and occupation. Operation Telic. UK withdrawal completed 2009.",
    category: "crisis"
  },
  { 
    id: "uk-war-26", 
    year: 2011, 
    month: 3, 
    title: "Libyan Civil War", 
    description: "NATO intervention including UK. Operation Ellamy. Aerial campaign against Gaddafi regime.",
    category: "crisis"
  },
  { 
    id: "uk-war-27", 
    year: 2014, 
    month: 9, 
    title: "Operation Shader", 
    description: "UK airstrikes against ISIS in Iraq and Syria. Part of international coalition. Ongoing until 2018.",
    category: "crisis"
  },
  { 
    id: "uk-war-28", 
    year: 2022, 
    month: 2, 
    title: "Support for Ukraine", 
    description: "UK provides military aid, training, and intelligence support to Ukraine against Russian invasion. Not direct combat.",
    category: "crisis"
  },
];

