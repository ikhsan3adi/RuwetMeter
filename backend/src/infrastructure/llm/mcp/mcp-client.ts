import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface McpTool {
  name: string;
  arguments: Record<string, unknown>;
}

export class McpClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;

  constructor() {
    this.client = new Client(
      { name: "ruwetmeter-mcp", version: "0.1.0" },
      { capabilities: {} },
    );
  }

  async connect(command: string, args: string[] = []): Promise<void> {
    this.transport = new StdioClientTransport({
      command,
      args,
    });
    await this.client.connect(this.transport);
  }

  async callTool(tool: McpTool): Promise<string> {
    const result = await this.client.callTool({
      name: tool.name,
      arguments: tool.arguments,
    });
    return JSON.stringify(result);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }
}
