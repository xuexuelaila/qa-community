export const stripEmojis = (text: string): string => {
  return text.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{200D}]/gu,
    ''
  );
};
