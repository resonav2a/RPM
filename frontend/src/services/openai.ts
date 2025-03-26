import { Task } from '../types';

export interface TextToTaskResponse {
  title: string;
  description: string;
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  tags: string[];
  campaign?: string;
  due_date?: string;
}

// Get API key from storage
const getApiKey = (): string => {
  return localStorage.getItem('openai_api_key') || '';
};

/**
 * Converts natural language text to a structured task using OpenAI
 * @param text The natural language description of the task
 * @returns A structured task object with title, description, priority, etc.
 */
export const textToTask = async (text: string): Promise<TextToTaskResponse> => {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.warn('No OpenAI API key found, using fallback mechanism');
      return processTextWithRules(text);
    }

    // OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // You can upgrade to GPT-4 for better results
        messages: [
          {
            role: 'system',
            content: `You are a task parser that converts natural language into structured task data. 
            Extract a title, description, priority level (p0=critical, p1=high, p2=medium, p3=low), 
            and up to 4 relevant tags. If you detect a campaign/project context, include that.
            Respond with valid JSON only in this format:
            {
              "title": "Short, clear task title",
              "description": "Detailed task description",
              "priority": "p0|p1|p2|p3",
              "tags": ["tag1", "tag2"],
              "campaign": "Campaign name if detected" (optional),
              "due_date": "YYYY-MM-DD if detected" (optional)
            }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.2,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Validate and sanitize the response
    return {
      title: result.title || text.substring(0, 50),
      description: result.description || text,
      priority: ['p0', 'p1', 'p2', 'p3'].includes(result.priority) ? result.priority : 'p2',
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 4) : [],
      campaign: result.campaign,
      due_date: result.due_date
    };
  } catch (error) {
    console.error('Error in textToTask:', error);
    // Fallback to rule-based processing if OpenAI fails
    return processTextWithRules(text);
  }
};

/**
 * Transcribes speech to text using OpenAI Whisper
 * @param audioBlob The audio blob to transcribe
 * @returns The transcribed text
 */
export const transcribeSpeech = async (audioBlob: Blob): Promise<string> => {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required for transcription');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Whisper API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error in transcribeSpeech:', error);
    throw error;
  }
};

/**
 * Fallback: Rule-based processing function
 * Used when the API key is not set or API calls fail
 */
function processTextWithRules(text: string): TextToTaskResponse {
  // Extract title - usually the first part of the text or after keywords like "need to" or "remind me to"
  let title = '';
  let description = text;
  let priority: 'p0' | 'p1' | 'p2' | 'p3' = 'p2'; // Default medium
  const tags: string[] = [];
  let campaign: string | undefined;
  
  // Extract title
  const titlePatterns = [
    /remind me to ([^,\.]+)/i,
    /need to ([^,\.]+)/i,
    /have to ([^,\.]+)/i,
    /should ([^,\.]+)/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      title = match[1].trim();
      break;
    }
  }
  
  // If no pattern matched, use the first sentence or phrase
  if (!title) {
    const firstSentence = text.split(/[\.!\?]/).filter(s => s.trim())[0];
    if (firstSentence) {
      title = firstSentence.trim();
    } else {
      title = text.substring(0, Math.min(50, text.length));
    }
  }
  
  // Extract priority
  if (/(urgent|asap|immediately|critical)/i.test(text)) {
    priority = 'p0'; // Critical
  } else if (/(high priority|important|high|priority)/i.test(text)) {
    priority = 'p1'; // High
  } else if (/(medium|normal)/i.test(text)) {
    priority = 'p2'; // Medium
  } else if (/(low|whenever|if you have time|not urgent)/i.test(text)) {
    priority = 'p3'; // Low
  }
  
  // Extract potential tags from common business terms
  const potentialTags = [
    'investor', 'fundraising', 'meeting', 'presentation', 'report',
    'design', 'development', 'marketing', 'sales', 'customer',
    'bug', 'feature', 'documentation', 'testing', 'research',
    'review', 'feedback', 'email', 'call', 'interview',
    'demo', 'product', 'team', 'planning', 'launch'
  ];
  
  for (const tag of potentialTags) {
    if (text.toLowerCase().includes(tag.toLowerCase())) {
      tags.push(tag);
    }
  }
  
  // Limit tags to top 4 most relevant
  const limitedTags = tags.slice(0, 4);
  
  // Extract campaign - simple matching based on common campaign types
  const campaignKeywords: Record<string, string> = {
    'fundraising': 'Fundraising 2025',
    'investor': 'Fundraising 2025',
    'marketing': 'Q2 Marketing',
    'launch': 'Product Launch',
    'release': 'Product Launch',
    'hiring': 'Team Expansion',
    'recruitment': 'Team Expansion'
  };
  
  for (const [keyword, campaignName] of Object.entries(campaignKeywords)) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      campaign = campaignName;
      break;
    }
  }
  
  // If title is too long, trim it
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }
  
  // Generate a description - we'll use the full text but clean it
  description = text.trim();
  
  return {
    title,
    description,
    priority,
    tags: limitedTags,
    campaign
  };
}