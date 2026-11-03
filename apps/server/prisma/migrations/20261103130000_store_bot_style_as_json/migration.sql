ALTER TABLE "bot" ADD COLUMN "style" JSONB;

UPDATE "bot"
SET "style" = jsonb_build_object(
  'colors', jsonb_build_object(
    'light', jsonb_build_object(
      'chatBackgroundColor', "chatBackgroundColor",
      'headerFooterBackgroundColor', "headerFooterBackgroundColor",
      'footerBackgroundColor', "footerBackgroundColor",
      'inputBackgroundColor', "inputBackgroundColor",
      'inputTextColor', "inputTextColor",
      'starterQuestionsTextColor', "starterQuestionsTextColor",
      'assistantMessageBackgroundColor', "assistantMessageBackgroundColor",
      'assistantMessageTextColor', "assistantMessageTextColor",
      'userMessageBackgroundColor', "userMessageBackgroundColor",
      'userMessageTextColor', "userMessageTextColor",
      'launcherBackgroundColor', "launcherBackgroundColor",
      'chatBorderColor', "chatBorderColor"
    ),
    'dark', jsonb_build_object(
      'chatBackgroundColor', "chatBackgroundColor",
      'headerFooterBackgroundColor', "headerFooterBackgroundColor",
      'footerBackgroundColor', "footerBackgroundColor",
      'inputBackgroundColor', "inputBackgroundColor",
      'inputTextColor', "inputTextColor",
      'starterQuestionsTextColor', "starterQuestionsTextColor",
      'assistantMessageBackgroundColor', "assistantMessageBackgroundColor",
      'assistantMessageTextColor', "assistantMessageTextColor",
      'userMessageBackgroundColor', "userMessageBackgroundColor",
      'userMessageTextColor', "userMessageTextColor",
      'launcherBackgroundColor', "launcherBackgroundColor",
      'chatBorderColor', "chatBorderColor"
    )
  ),
  'avatarUrl', "avatarUrl",
  'launcherSize', "launcherSize",
  'launcherIcon', "launcherIcon",
  'chatBorderWidth', "chatBorderWidth",
  'chatFontFamily', "chatFontFamily",
  'chatMessageFontSize', "chatMessageFontSize",
  'chatWidth', "chatWidth",
  'chatHeight', "chatHeight",
  'chatRadius', "chatRadius",
  'messageRadius', "messageRadius",
  'chatShadow', "chatShadow",
  'floatingPosition', "floatingPosition"
);

ALTER TABLE "bot" ALTER COLUMN "style" SET NOT NULL;

ALTER TABLE "bot"
  DROP COLUMN "chatBackgroundColor",
  DROP COLUMN "headerFooterBackgroundColor",
  DROP COLUMN "footerBackgroundColor",
  DROP COLUMN "inputBackgroundColor",
  DROP COLUMN "inputTextColor",
  DROP COLUMN "starterQuestionsTextColor",
  DROP COLUMN "assistantMessageBackgroundColor",
  DROP COLUMN "assistantMessageTextColor",
  DROP COLUMN "userMessageBackgroundColor",
  DROP COLUMN "userMessageTextColor",
  DROP COLUMN "launcherBackgroundColor",
  DROP COLUMN "chatBorderColor",
  DROP COLUMN "launcherSize",
  DROP COLUMN "launcherIcon",
  DROP COLUMN "chatBorderWidth",
  DROP COLUMN "chatFontFamily",
  DROP COLUMN "chatMessageFontSize",
  DROP COLUMN "chatWidth",
  DROP COLUMN "chatHeight",
  DROP COLUMN "chatRadius",
  DROP COLUMN "messageRadius",
  DROP COLUMN "chatShadow",
  DROP COLUMN "floatingPosition";

ALTER TABLE "bot" DROP COLUMN "avatarUrl";
