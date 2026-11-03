import type { ChatConfig } from '@/domain/enterprise/entities/chat-config';
import type { BotStyle } from '@/domain/enterprise/entities/bot-style';

export class PublicChatConfigPresenter {
  static toHTTP(
    config: ChatConfig,
    style: BotStyle,
    starterQuestions = config.starterQuestions,
  ) {
    return {
      inputPlaceholder: config.inputPlaceholder,
      submitButtonText: config.submitButtonText,
      showMessageTimestamps: config.showMessageTimestamps,
      starterQuestions,
      generateStarterQuestionsAfterResponse:
        config.generateStarterQuestionsAfterResponse,
      initialMessage: config.initialMessage,
      headerStatusText: config.headerStatusText,
      style,
    };
  }
}
