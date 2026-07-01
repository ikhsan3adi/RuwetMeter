export interface TelegramSendMessageParams {
  chatId: number
  text: string
  parseMode?: 'HTML' | 'MarkdownV2'
}

export interface TelegramServicePort {
  sendMessage(params: TelegramSendMessageParams): Promise<void>
  sendChatAction(chatId: number, action: 'typing'): Promise<void>
}
