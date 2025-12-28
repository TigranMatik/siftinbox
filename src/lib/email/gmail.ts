import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";

export interface GmailCredentials {
  accessToken: string;
  refreshToken: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  date: Date;
  snippet: string;
  body: string;
  labels: string[];
}

export class GmailClient {
  private gmail: gmail_v1.Gmail;
  private oauth2Client;
  private refreshToken: string;
  private onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;

  constructor(
    credentials: GmailCredentials,
    onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>
  ) {
    this.refreshToken = credentials.refreshToken;
    this.onTokenRefresh = onTokenRefresh;

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`
    );

    this.oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });

    // Handle automatic token refresh
    this.oauth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token && this.onTokenRefresh) {
        await this.onTokenRefresh({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || this.refreshToken,
        });
      }
    });

    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  async getNewTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        return {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || "",
        };
      }
      return null;
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      return null;
    }
  }

  async getProfile(): Promise<{ email: string } | null> {
    try {
      const response = await this.gmail.users.getProfile({ userId: "me" });
      return { email: response.data.emailAddress || "" };
    } catch (error) {
      console.error("Error getting profile:", error);
      return null;
    }
  }

  async getUnreadCount(after?: Date): Promise<number> {
    try {
      let query = "is:unread";
      if (after) {
        query += ` after:${Math.floor(after.getTime() / 1000)}`;
      }

      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        labelIds: ["INBOX"],
        maxResults: 100,
      });

      return response.data.resultSizeEstimate || response.data.messages?.length || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  async listMessages(
    options: {
      maxResults?: number;
      after?: Date;
      labelIds?: string[];
    } = {}
  ): Promise<EmailMessage[]> {
    const { maxResults = 50, after, labelIds = ["INBOX"] } = options;

    try {
      let query = "";
      if (after) {
        query = `after:${Math.floor(after.getTime() / 1000)}`;
      }

      const response = await this.gmail.users.messages.list({
        userId: "me",
        maxResults,
        q: query,
        labelIds,
      });

      const messages = response.data.messages || [];
      const fullMessages: EmailMessage[] = [];

      for (const msg of messages) {
        if (msg.id) {
          const fullMessage = await this.getMessage(msg.id);
          if (fullMessage) {
            fullMessages.push(fullMessage);
          }
        }
      }

      return fullMessages;
    } catch (error) {
      console.error("Error listing messages:", error);
      return [];
    }
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const message = response.data;
      const headers = message.payload?.headers || [];

      const getHeader = (name: string): string => {
        const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
        return header?.value || "";
      };

      const from = getHeader("From");
      const { name: fromName, email: fromEmail } = parseEmailAddress(from);

      const body = extractBody(message.payload);

      return {
        id: message.id || "",
        threadId: message.threadId || "",
        subject: getHeader("Subject"),
        from,
        fromName,
        fromEmail,
        to: getHeader("To"),
        date: new Date(parseInt(message.internalDate || "0")),
        snippet: message.snippet || "",
        body,
        labels: message.labelIds || [],
      };
    } catch (error) {
      console.error("Error getting message:", error);
      return null;
    }
  }
}

function parseEmailAddress(address: string): { name: string; email: string } {
  const match = address.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim() || match[2].split("@")[0],
      email: match[2].trim(),
    };
  }
  return { name: address, email: address };
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  // Check for direct body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Check parts recursively
  if (payload.parts) {
    // Prefer text/plain over text/html
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }

    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      return stripHtml(decodeBase64Url(htmlPart.body.data));
    }

    // Recurse into multipart
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }

  return "";
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
