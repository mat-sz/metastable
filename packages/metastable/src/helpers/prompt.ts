const STYLE_PROMPT_REPLACEMENT_TOKEN = '{prompt}';

export function applyStyleToPrompt(
  prompt: string,
  stylePrompt: string = '',
): string {
  if (stylePrompt.includes(STYLE_PROMPT_REPLACEMENT_TOKEN)) {
    return stylePrompt.replace(STYLE_PROMPT_REPLACEMENT_TOKEN, prompt);
  }

  const parts = [prompt.trim(), stylePrompt.trim()].filter(part => !!part);
  return parts.join(', ');
}
