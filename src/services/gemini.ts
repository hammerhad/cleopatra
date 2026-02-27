import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { CyclePhase } from '../types/cycle';
import type { MoodRating } from '../types/journal';

// ── Client init ───────────────────────────────────────────────────────────────
// Key lives in .env and is loaded via Constants.expoConfig.extra
// For production, proxy through Cloud Functions to protect the key
let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// ── Safety settings ───────────────────────────────────────────────────────────
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// ── System persona ────────────────────────────────────────────────────────────
function buildCleopatraPersona(context?: CleopatraContext): string {
  const phaseWisdom: Record<CyclePhase, string> = {
    menstrual: 'You are in the Blood Moon phase — a time of deep intuition, rest, and release. Your counsel should honor her need to turn inward and be gentle.',
    follicular: 'She is in the Rising Tide phase — energy is building, curiosity ignites. Encourage action and new beginnings.',
    ovulation: 'This is her Peak Radiance phase — magnetic power and peak performance. Challenge her to lead, speak boldly, and expand.',
    luteal: 'She is in the Inner Oracle phase — analysis, intuition, and boundaries rule. Honor the deep knowing she carries.',
  };

  const phaseContext = context?.cyclePhase ? phaseWisdom[context.cyclePhase] : '';

  return `You are Cleopatra — Queen of Egypt, master strategist, polyglot scholar, and the most powerful woman in human history. You speak to a modern woman as an equal, a sister, a mentor who has walked every battlefield of power, love, and self-mastery.

Your voice is:
- Regal but warm — never cold or distant
- Direct and bold — you do not soften truth, but you deliver it with compassion
- Poetic and rich — you choose words like Cleopatra chose jewels: deliberately
- Wise without being preachy — you share from experience, not from a pedestal
- Grounded in real strategy — you are a ruler, not a life coach
- Ancient soul in modern understanding — you speak contemporary truths in timeless language

You never:
- Use generic motivational phrases ("You've got this!", "Believe in yourself!")
- Speak in bullet points or listicles
- Moralize or judge
- Give medical advice
- Use emoji in your response
- Be sycophantic or hollow

You always:
- Speak in 2-4 rich paragraphs
- Reference strategy, empire, power, and sovereignty as metaphors for daily life
- End with a single, devastating insight or question that will stay with her
- Address her as "my queen" naturally when appropriate, but not every sentence

${phaseContext ? `\n\nCycle awareness for this response: ${phaseContext}` : ''}
${context?.mood ? `\nHer current mood rating: ${context.mood}/5` : ''}

Respond to her journal entry with Cleopatra's wisdom, compassion, and fire.`;
}

export interface CleopatraContext {
  cyclePhase?: CyclePhase;
  mood?: MoodRating;
  streakCount?: number;
}

export interface CleopatraResponse {
  text: string;
  tokens: number;
  modelVersion: string;
}

// ── Core function: Ask Cleopatra ──────────────────────────────────────────────
export async function askCleopatra(
  journalEntry: string,
  context?: CleopatraContext
): Promise<CleopatraResponse> {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: buildCleopatraPersona(context),
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.85,
      topP: 0.92,
      topK: 40,
      maxOutputTokens: 600,
      candidateCount: 1,
    },
  });

  const prompt = `Here is her journal entry:\n\n"${journalEntry.trim()}"\n\nRespond as Cleopatra with insight, depth, and fire.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  return {
    text: text.trim(),
    tokens: response.usageMetadata?.totalTokenCount ?? 0,
    modelVersion: 'gemini-1.5-flash',
  };
}

// ── Streaming version for live typing effect ──────────────────────────────────
export async function askCleopatraStreaming(
  journalEntry: string,
  context: CleopatraContext | undefined,
  onChunk: (chunk: string) => void,
  onComplete: (fullText: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const client = getClient();

    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: buildCleopatraPersona(context),
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        temperature: 0.85,
        topP: 0.92,
        topK: 40,
        maxOutputTokens: 600,
      },
    });

    const prompt = `Here is her journal entry:\n\n"${journalEntry.trim()}"\n\nRespond as Cleopatra with insight, depth, and fire.`;

    const result = await model.generateContentStream(prompt);

    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(chunkText);
    }

    onComplete(fullText.trim());
  } catch (error) {
    onError(error as Error);
  }
}

// ── Daily insight for dashboard ───────────────────────────────────────────────
export async function getDailyCleopatraInsight(
  context: CleopatraContext
): Promise<string> {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: buildCleopatraPersona(context),
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 120,
    },
  });

  const prompt = context.cyclePhase
    ? `Give a single powerful sentence of morning wisdom for a woman in her ${context.cyclePhase} phase today. No explanation, just the insight.`
    : `Give a single powerful sentence of morning wisdom for a queen beginning her day. No explanation, just the insight.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ── Habit reflection ──────────────────────────────────────────────────────────
export async function getHabitReflection(
  habitName: string,
  currentStreak: number,
  context?: CleopatraContext
): Promise<string> {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: buildCleopatraPersona(context),
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 150,
    },
  });

  const prompt = currentStreak > 0
    ? `She has maintained her "${habitName}" ritual for ${currentStreak} consecutive days. Give her a brief, powerful word of acknowledgment in Cleopatra's voice. Two sentences maximum.`
    : `She has broken her "${habitName}" streak. Offer a brief, fierce and compassionate response that reminds her who she is. Two sentences maximum.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
