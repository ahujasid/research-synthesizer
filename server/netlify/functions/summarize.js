const axios = require('axios');

// Helper function to split text into chunks
function splitText(text, maxChunkSize) {
  const words = text.split(' ');
  let chunks = [];
  let currentChunk = [];

  words.forEach(word => {
    currentChunk.push(word);
    if (currentChunk.join(' ').length > maxChunkSize) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  });

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// Function to summarize a text using OpenAI API
async function summarizeWithOpenAIShort(apiKey, text, maxTokens) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: "gpt-3.5-turbo-instruct",
        prompt: `I just ran some user interviews. Here are some quotes and observations from the interviews. I want you to summarize the text in only ONE sentence concisely with the key findings. Don't complete, only summarize: \n\n${text}`,
        max_tokens: maxTokens,
        temperature: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    // console.log(response);
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error in summarizing with OpenAI:', error);
    return '';
  }
}

async function summarizeWithOpenAILong(apiKey, text, maxTokens) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: "gpt-3.5-turbo-instruct",
        prompt: `I just ran some user interviews. Here are some summaries from the interviews. I want you to summarize these in only ONE paragraph. Don't complete, only summarize: \n\n${text}`,
        max_tokens: maxTokens,
        temperature: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    // console.log(response.data.choices[0]);
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error in summarizing with OpenAI:', error);
    return '';
  }
}

exports.handler = async (event, context) => {
  // Existing CORS headers setup
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Existing OPTIONS request handling
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "You can use CORS" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { apiKey, text } = body;

    // Split the text into smaller chunks
    const chunks = splitText(text, 3000); // Adjust the chunk size as needed

    // Summarize each chunk
    const chunkSummaries = await Promise.all(chunks.map(chunk => summarizeWithOpenAIShort(apiKey, chunk, 250)));
    
    // Concatenate chunk summaries and summarize again
    const concatenatedSummary = chunkSummaries.join(' ');
  

    console.log("Concatenated Summary for Final Summarization:", concatenatedSummary);

    const finalSummary = await summarizeWithOpenAILong(apiKey, concatenatedSummary, 1000);
    console.log("OpenAI API Response for Final Summary:", finalSummary);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ summary: finalSummary })
      // body: JSON.stringify({ summary: concatenatedSummary })
    };

  } catch (error) {
    // Existing error handling
    console.error('Error:', error);
    if (error.response) {
      console.error('OpenAI API Response:', error.response.data);
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal Server Error", error: error.message })
    };
  }
};
