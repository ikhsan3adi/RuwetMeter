export interface ChatResult {
  reply: string
  sourceUrls: string[]
}

export interface ChatProviderPort {
  respond(context: string, question: string): Promise<ChatResult>
}
