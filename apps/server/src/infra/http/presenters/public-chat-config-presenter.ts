import type { ChatConfig } from '@/domain/enterprise/entities/chat-config';

export class PublicChatConfigPresenter {
  static toHTTP(config: ChatConfig, starterQuestions = config.starterQuestions) {
    return {
      avatarUrl: config.avatarUrl,
      inputPlaceholder: config.inputPlaceholder,
      submitButtonText: config.submitButtonText,
      showMessageTimestamps: config.showMessageTimestamps,
      starterQuestions,
      generateStarterQuestionsAfterResponse:
        config.generateStarterQuestionsAfterResponse,
      initialMessage: config.initialMessage,
      headerStatusText: config.headerStatusText,
      chatBackgroundColor: config.chatBackgroundColor,
      headerFooterBackgroundColor: config.headerFooterBackgroundColor,
      assistantMessageBackgroundColor: config.assistantMessageBackgroundColor,
      userMessageBackgroundColor: config.userMessageBackgroundColor,
    };
  }
}
