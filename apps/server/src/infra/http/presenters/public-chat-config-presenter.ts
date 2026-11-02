import type { ChatConfig } from '@/domain/enterprise/entities/chat-config';

export class PublicChatConfigPresenter {
  static toHTTP(
    config: ChatConfig,
    starterQuestions = config.starterQuestions,
  ) {
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
      footerBackgroundColor: config.footerBackgroundColor,
      inputBackgroundColor: config.inputBackgroundColor,
      inputTextColor: config.inputTextColor,
      starterQuestionsTextColor: config.starterQuestionsTextColor,
      assistantMessageBackgroundColor: config.assistantMessageBackgroundColor,
      assistantMessageTextColor: config.assistantMessageTextColor,
      userMessageBackgroundColor: config.userMessageBackgroundColor,
      userMessageTextColor: config.userMessageTextColor,
      launcherBackgroundColor: config.launcherBackgroundColor,
      launcherSize: config.launcherSize,
      launcherIcon: config.launcherIcon,
      chatBorderColor: config.chatBorderColor,
      chatBorderWidth: config.chatBorderWidth,
      chatFontFamily: config.chatFontFamily,
      chatMessageFontSize: config.chatMessageFontSize,
      chatWidth: config.chatWidth,
      chatHeight: config.chatHeight,
      chatRadius: config.chatRadius,
      messageRadius: config.messageRadius,
      chatShadow: config.chatShadow,
      floatingPosition: config.floatingPosition,
    };
  }
}
