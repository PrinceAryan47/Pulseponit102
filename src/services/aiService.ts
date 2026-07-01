export enum Type {
  STRING = "STRING",
  INTEGER = "INTEGER",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
}

interface GenerateContentParams {
  model?: string;
  contents: string | any[];
  config?: any;
}

export class GoogleGenAI {
  constructor(config?: { apiKey: string }) {
    // Under our full-stack proxy architecture, the API key is kept safely on the server.
    // We ignore the client-side apiKey parameter.
  }

  get models() {
    return {
      generateContent: async (params: GenerateContentParams) => {
        try {
          const response = await fetch("/api/ai/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: params.model,
              contents: params.contents,
              config: params.config,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to generate content via backend routing");
          }

          const data = await response.json();
          return {
            text: data.text || "",
            groundingMetadata: data.groundingMetadata
          };
        } catch (error) {
          console.error("Client proxy request failed:", error);
          throw error;
        }
      }
    };
  }

  get chats() {
    return {
      create: (params: { model?: string; config?: { systemInstruction?: string }; history?: any[] }) => {
        return {
          sendMessage: async (msgParams: { message: string }) => {
            const contents = [];
            
            // Reconstruct full chat conversations for backend processing
            const history = params.history || [];
            for (const item of history) {
              contents.push({
                role: item.role,
                parts: item.parts
              });
            }
            
            // Append newest user message
            contents.push({
              role: "user",
              parts: [{ text: msgParams.message }]
            });

            const response = await fetch("/api/ai/generate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: params.model,
                contents: contents,
                config: params.config,
                tools: params.config?.tools,
                toolConfig: params.config?.toolConfig
              }),
            });

            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.error || "Failed to transmit chat message via proxy");
            }

            const data = await response.json();
            return {
              text: data.text || "",
              groundingMetadata: data.groundingMetadata
            };
          }
        };
      }
    };
  }
}
