export type ChartType = 'pie' | 'bar' | 'line' | 'area' | 'scatter' | 'donut';

export interface ChartTypeInfo {
  name: string;
  icon: string;
  description: string;
}

export const CHART_TYPES: Record<ChartType, ChartTypeInfo> = {
  pie: {
    name: 'Pie Chart',
    icon: '🥧',
    description: 'Best for showing proportions and percentages',
  },
  bar: {
    name: 'Bar Chart',
    icon: '📊',
    description: 'Best for comparing categories and values',
  },
  line: {
    name: 'Line Chart',
    icon: '📈',
    description: 'Best for showing trends over time',
  },
  area: {
    name: 'Area Chart',
    icon: '📉',
    description: 'Best for showing cumulative values over time',
  },
  scatter: {
    name: 'Scatter Plot',
    icon: '🔵',
    description: 'Best for showing relationships between variables',
  },
  donut: {
    name: 'Donut Chart',
    icon: '🍩',
    description: 'Best for showing proportions with emphasis on segments',
  },
};

export interface StatisticsTemplate {
  id: string;
  title: string;
  description: string;
  category: 'politics' | 'economics' | 'education' | 'health' | 'society' | 'technology' | 'environment';
  icon: string;
  exampleFields: string[];
  suggestedChartTypes: ChartType[];
}

export const STATISTICS_TEMPLATES: StatisticsTemplate[] = [
  {
    id: 'uk-mps-by-party',
    title: 'UK MPs by Political Party',
    description: 'A statistical breakdown of Members of Parliament by their political party affiliation.',
    category: 'politics',
    icon: '🏛️',
    exampleFields: ['Number of MPs from each party', 'Percentage of seats held', 'Regional distribution'],
    suggestedChartTypes: ['pie', 'bar', 'donut'],
  },
  {
    id: 'uk-housing-costs',
    title: 'UK Housing Costs',
    description: 'Statistical analysis of housing prices and costs across different regions of the UK.',
    category: 'economics',
    icon: '🏠',
    exampleFields: ['Average cost of a UK home', 'Price per square meter', 'Regional variations'],
    suggestedChartTypes: ['bar', 'line', 'area'],
  },
  {
    id: 'gcse-results',
    title: 'GCSE Results Statistics',
    description: 'Educational statistics showing GCSE pass rates and grade distributions.',
    category: 'education',
    icon: '📚',
    exampleFields: ['Number of children passing GCSE grades', 'Grade distribution', 'Subject pass rates'],
    suggestedChartTypes: ['bar', 'pie', 'line'],
  },
  {
    id: 'nhs-waiting-times',
    title: 'NHS Waiting Times',
    description: 'Healthcare statistics showing NHS waiting times across different departments and regions.',
    category: 'health',
    icon: '🏥',
    exampleFields: ['Average waiting time by department', 'Regional variations', 'Time to treatment'],
    suggestedChartTypes: ['bar', 'line', 'area'],
  },
  {
    id: 'unemployment-rates',
    title: 'Unemployment Rates',
    description: 'Economic statistics showing unemployment rates by region, age group, and industry.',
    category: 'economics',
    icon: '💼',
    exampleFields: ['Unemployment rate by region', 'Age group breakdown', 'Industry sector analysis'],
    suggestedChartTypes: ['bar', 'line', 'pie'],
  },
  {
    id: 'carbon-emissions',
    title: 'Carbon Emissions by Sector',
    description: 'Environmental statistics showing carbon emissions broken down by different sectors.',
    category: 'environment',
    icon: '🌍',
    exampleFields: ['Emissions by sector', 'Year-over-year changes', 'Regional contributions'],
    suggestedChartTypes: ['pie', 'bar', 'area'],
  },
  {
    id: 'tech-adoption',
    title: 'Technology Adoption Rates',
    description: 'Statistics on technology adoption and usage across different demographics.',
    category: 'technology',
    icon: '💻',
    exampleFields: ['Smartphone ownership by age', 'Internet usage rates', 'Social media platform adoption'],
    suggestedChartTypes: ['bar', 'pie', 'line'],
  },
  {
    id: 'crime-statistics',
    title: 'Crime Statistics by Type',
    description: 'Statistical breakdown of crime rates by type and region.',
    category: 'society',
    icon: '🚔',
    exampleFields: ['Crime rate by type', 'Regional variations', 'Year-over-year trends'],
    suggestedChartTypes: ['bar', 'pie', 'line'],
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  politics: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  economics: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  education: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  health: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  society: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  technology: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  environment: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
};

