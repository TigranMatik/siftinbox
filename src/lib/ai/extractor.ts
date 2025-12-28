import OpenAI from "openai";
import { truncateForAI } from "../email/parser";
import type { EmailMessage } from "../email/gmail";
import type { Priority, DeadlineSource } from "@/types/database";

const client = new OpenAI();

export interface ExtractedAction {
  title: string;
  description: string;
  deadline: Date | null;
  deadlineSource: DeadlineSource;
  priority: Priority;
}

export interface ExtractionResult {
  isActionable: boolean;
  actions: ExtractedAction[];
  reasoning: string;
}

interface AIResponse {
  isActionable: boolean;
  actions: Array<{
    title: string;
    description: string;
    deadline: string | null;
    deadlineSource: "explicit" | "inferred" | "none";
    priority: "high" | "medium" | "low";
  }>;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are an AI assistant that analyzes emails to extract action items. Your task is to identify tasks, requests, or actions that require the recipient's attention or response.

For each email, you must:
1. Determine if the email contains actionable items (not just informational content, newsletters, or automated notifications)
2. Extract specific action items with clear titles and descriptions
3. Identify any deadlines (explicit dates mentioned, or inferred from context like "by end of week")
4. Assess priority based on urgency signals, sender importance, and deadline proximity

Respond with a JSON object in this exact format:
{
  "isActionable": boolean,
  "actions": [
    {
      "title": "Brief action title (max 50 chars)",
      "description": "Detailed description of what needs to be done",
      "deadline": "ISO date string or null",
      "deadlineSource": "explicit" | "inferred" | "none",
      "priority": "high" | "medium" | "low"
    }
  ],
  "reasoning": "Brief explanation of your analysis"
}

Priority guidelines:
- high: Urgent requests, tight deadlines (within 24-48 hours), important senders, critical business matters
- medium: Normal requests with reasonable deadlines, standard business communications
- low: Nice-to-have tasks, no deadline, informational requests

Only extract genuine action items. Ignore:
- Marketing emails and newsletters
- Automated notifications (shipping updates, social media alerts)
- Spam or promotional content
- Pure informational messages with no required action`;

export async function extractActionsFromEmail(
  email: EmailMessage
): Promise<ExtractionResult> {
  try {
    const truncatedBody = truncateForAI(email.body);

    const response = await client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Analyze this email for action items:

Subject: ${email.subject}
From: ${email.fromName} <${email.fromEmail}>
Date: ${email.date.toISOString()}

Body:
${truncatedBody}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed: AIResponse = JSON.parse(content);

    return {
      isActionable: parsed.isActionable,
      actions: parsed.actions.map((action) => ({
        title: action.title,
        description: action.description,
        deadline: action.deadline ? new Date(action.deadline) : null,
        deadlineSource: action.deadlineSource,
        priority: action.priority,
      })),
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error("Error extracting actions from email:", error);
    return {
      isActionable: false,
      actions: [],
      reasoning: "Error processing email",
    };
  }
}

export async function generateDailySummary(
  actions: ExtractedAction[],
  userName: string
): Promise<string> {
  if (actions.length === 0) {
    return "No new action items today. Your inbox is clear of pending responsibilities.";
  }

  try {
    const actionList = actions
      .map(
        (a, i) =>
          `${i + 1}. [${a.priority.toUpperCase()}] ${a.title}${
            a.deadline ? ` (Due: ${a.deadline.toLocaleDateString()})` : ""
          }`
      )
      .join("\n");

    const response = await client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates brief, professional daily briefing summaries. Be concise but informative.",
        },
        {
          role: "user",
          content: `Create a brief daily briefing summary (2-3 sentences) for ${userName} based on these action items extracted from their emails today:\n\n${actionList}\n\nFocus on the most important or urgent items and give an encouraging, professional overview of what needs attention today.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return (
      response.choices[0]?.message?.content ||
      `You have ${actions.length} action item${actions.length !== 1 ? "s" : ""} to review today.`
    );
  } catch (error) {
    console.error("Error generating daily summary:", error);
    return `You have ${actions.length} action item${actions.length !== 1 ? "s" : ""} to review today.`;
  }
}
