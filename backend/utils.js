// С вероятностью обрывает фразу, создавая эффект «недосказанности»
export function maybeCut(text) {
  if (!text) return text;

  if (Math.random() < 0.3) {
    const min = Math.floor(text.length * 0.4);
    const max = Math.floor(text.length * 0.8);
    const cut = Math.floor(min + Math.random() * (max - min));
    return text.slice(0, cut) + '...';
  }

  return text;
}
