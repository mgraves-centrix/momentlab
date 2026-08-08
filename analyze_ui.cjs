const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs');

async function analyze() {
  try {
    const vertexAI = new VertexAI({ project: 'playpen-c2b64d', location: 'us-central1' });
    const model = vertexAI.preview.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const imagePath = './momentlab-reference-pack/desktop/04-response-timeline.png';
    if (!fs.existsSync(imagePath)) {
      console.log("Image not found");
      return;
    }
    
    const image = fs.readFileSync(imagePath);
    const tsxCode = fs.readFileSync('./src/pages/ResponseTimelinePage.tsx', 'utf8');
    
    const prompt = `I want to ensure a 100% pixel-perfect match between the reference image and its corresponding live UI route.
    
    Here is the TSX code:
    \`\`\`tsx
    ${tsxCode}
    \`\`\`
    
    Please perform a strict side-by-side comparison of the rendered UI code vs. the reference image.
    Output a bulleted list of every visual discrepancy. Check:
    - Layout ratios (31/46/23)
    - Positioning of elements
    - Header titles, subtitles, text copy
    - Missing or misplaced components`;

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: image.toString('base64'), mimeType: 'image/png' } }
          ]
        }
      ]
    };
    
    const result = await model.generateContent(request);
    console.log(result.response.candidates[0].content.parts[0].text);
  } catch(e) {
    console.error(e);
  }
}
analyze();
