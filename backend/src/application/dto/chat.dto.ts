export interface ChatRequestDto {
  message: string
  session_id?: string
}

export interface ChatResponseDto {
  reply: string
  sources: string[]
}

export interface ErrorResponseDto {
  error: {
    code: string
    message: string
  }
}
