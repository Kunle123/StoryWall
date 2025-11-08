// Simulating the prompt building for "Netflix launches streaming"
const event = {
  title: "Netflix launches streaming (Watch Now)",
  description: "Netflix introduces its Watch Now streaming feature to customers — a decisive pivot from DVDs that starts the company's transformation into a global streaming service.",
  year: 2007
};
const imageStyle = "3D Render";
const colorName = "vivid pink";
const styleVisualLanguage = "3D rendered style, dimensional depth, realistic lighting, volumetric shadows, modern digital art, polished finish";

// Build prompt (simplified version of your code)
const descWords = event.description.split(' ').slice(0, 15).join(' ');
const visualDescription = `${event.title}: ${descWords}`;
const yearContext = `, historical period ${event.year}`;
let prompt = `${imageStyle} style: ${visualDescription}${yearContext}`;
prompt += `. Depict the specific event: ${event.title}`;
prompt += `. Subtle ${colorName} accent elements`;
prompt += `. ${styleVisualLanguage}`;
prompt += `. Balanced composition, centered focal point, clear visual storytelling`;
prompt += `. No text, no words, no written content, no labels. Pure visual scene without any readable text or letters`;

console.log("FULL PROMPT:");
console.log(prompt);
console.log("\nLENGTH:", prompt.length);
