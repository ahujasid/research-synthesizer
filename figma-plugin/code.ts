/// <reference types="@figma/plugin-typings" />

// Function to send request to your Netlify backend server for summarization
async function summarizeText(apiKey: string, text: string): Promise<string> {
  const response = await fetch("https://research-synthesiser-server.netlify.app/.netlify/functions/summarize", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey, text })
  });

  const data = await response.json();
  return data.summary; // Adjust this according to the response format from your server
}

function processNode(node: SceneNode, textContents: string[]) {
  if (node.type === 'TEXT') {
    textContents.push((node as TextNode).characters);
  } else if (node.type === 'STICKY') {
    textContents.push((node as StickyNode).text.characters);
  }

  if ('children' in node) {
    for (const childNode of node.children) {
      processNode(childNode as SceneNode, textContents);
    }
  }
}

async function readTextFromSelectedNodes(apiKey: string) {
  const selectedNodes = figma.currentPage.selection;
  let textContents: string[] = [];

  selectedNodes.forEach(node => processNode(node as SceneNode, textContents));

  let allText = textContents.join(' ');
  console.log("Text to be summarized:", allText); // Log the text here

  const summary = await summarizeText(apiKey, allText);
  figma.ui.postMessage({ type: 'text-summary', summary });
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'read-text') {
    const apiKey = msg.apiKey;
    const summary = await readTextFromSelectedNodes(apiKey);
    // Post the summary message to the UI script
    // figma.ui.postMessage({ type: 'text-summary', summary });
  }
};

figma.showUI(__html__);
