import type { EmailMessage } from "./gmail";

// Patterns that indicate noise emails (newsletters, marketing, etc.)
const NOISE_PATTERNS = {
  senders: [
    /noreply@/i,
    /no-reply@/i,
    /donotreply@/i,
    /notifications?@/i,
    /newsletter@/i,
    /marketing@/i,
    /promo@/i,
    /updates?@/i,
    /digest@/i,
    /info@/i,
    /support@.*\.com$/i,
    /mailer-daemon/i,
  ],
  subjects: [
    /unsubscribe/i,
    /newsletter/i,
    /weekly digest/i,
    /daily digest/i,
    /your \w+ receipt/i,
    /order confirmation/i,
    /shipping confirmation/i,
    /delivery notification/i,
    /password reset/i,
    /verify your email/i,
    /welcome to/i,
    /thanks for signing up/i,
    /promotional/i,
    /sale ends/i,
    /% off/i,
    /limited time/i,
    /don't miss/i,
    /reminder: your/i,
  ],
  labels: [
    "CATEGORY_PROMOTIONS",
    "CATEGORY_UPDATES",
    "CATEGORY_SOCIAL",
    "CATEGORY_FORUMS",
  ],
};

// Patterns that indicate actionable emails
const ACTION_PATTERNS = {
  subjects: [
    /action required/i,
    /action needed/i,
    /urgent/i,
    /please review/i,
    /approval needed/i,
    /waiting for your/i,
    /response needed/i,
    /reminder:/i,
    /follow-up/i,
    /deadline/i,
    /due (today|tomorrow|by)/i,
    /asap/i,
    /time-sensitive/i,
    /immediate attention/i,
  ],
  body: [
    /can you (please )?(send|provide|share|review|approve|confirm)/i,
    /please (send|provide|share|review|approve|confirm|let me know)/i,
    /i need you to/i,
    /could you (please )?/i,
    /would you (please )?/i,
    /by (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /by (end of day|eod|cob|tomorrow|next week)/i,
    /deadline is/i,
    /due (on|by)/i,
    /respond by/i,
    /let me know (by|if|when|what)/i,
    /awaiting your (response|reply|feedback|approval)/i,
    /your (input|feedback|approval|decision) is needed/i,
    /schedule a (call|meeting)/i,
    /can we (meet|talk|discuss)/i,
  ],
};

export interface FilterResult {
  isNoise: boolean;
  isLikelyActionable: boolean;
  noiseReason?: string;
  actionIndicators: string[];
}

export function filterEmail(email: EmailMessage): FilterResult {
  const result: FilterResult = {
    isNoise: false,
    isLikelyActionable: false,
    actionIndicators: [],
  };

  // Check for noise patterns
  for (const pattern of NOISE_PATTERNS.senders) {
    if (pattern.test(email.fromEmail)) {
      result.isNoise = true;
      result.noiseReason = `Automated sender: ${email.fromEmail}`;
      break;
    }
  }

  if (!result.isNoise) {
    for (const pattern of NOISE_PATTERNS.subjects) {
      if (pattern.test(email.subject)) {
        result.isNoise = true;
        result.noiseReason = `Marketing/notification subject pattern`;
        break;
      }
    }
  }

  if (!result.isNoise) {
    for (const label of email.labels) {
      if (NOISE_PATTERNS.labels.includes(label)) {
        result.isNoise = true;
        result.noiseReason = `Gmail category: ${label}`;
        break;
      }
    }
  }

  // If not noise, check for action patterns
  if (!result.isNoise) {
    for (const pattern of ACTION_PATTERNS.subjects) {
      if (pattern.test(email.subject)) {
        result.isLikelyActionable = true;
        result.actionIndicators.push(`Subject contains: "${email.subject.match(pattern)?.[0]}"`);
      }
    }

    for (const pattern of ACTION_PATTERNS.body) {
      if (pattern.test(email.body)) {
        result.isLikelyActionable = true;
        const match = email.body.match(pattern)?.[0];
        if (match && !result.actionIndicators.includes(match)) {
          result.actionIndicators.push(`Body contains: "${match.slice(0, 50)}..."`);
        }
      }
    }

    // Primary inbox emails from real people are more likely actionable
    if (email.labels.includes("CATEGORY_PERSONAL") || email.labels.includes("IMPORTANT")) {
      result.isLikelyActionable = true;
      result.actionIndicators.push("Marked as personal/important");
    }
  }

  return result;
}

export function truncateForAI(text: string, maxLength: number = 4000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "\n\n[Content truncated for processing]";
}
