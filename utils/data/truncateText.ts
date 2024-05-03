export const truncateText = (text: string, limit: number): string => {
    const words = text.split(' ');
    if (words.length <= limit) return text;

    const startWords = words.slice(0, Math.ceil(limit / 2)).join(' ');
    const endWords = words.slice(-Math.floor(limit / 2)).join(' ');
    return `${startWords} ... ${endWords}`;
};