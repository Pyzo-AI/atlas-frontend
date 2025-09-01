export const getTokens = () => {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem("trainboost_tokens") || '{}');
  }
  return {};
};