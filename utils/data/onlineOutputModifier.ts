export function modifyParagraphs(input: string): string {
  let lines = input.split('\n');
  let startsWithPrefix = lines.map((line) =>
    line.startsWith('ONLINE MODE ACTION: '),
  );
  let firstIndex = startsWithPrefix.indexOf(true);
  let lastIndex = startsWithPrefix.lastIndexOf(true);

  let modifiedLines = lines.map((line, index) => {
    if (startsWithPrefix[index]) {
      let content = line.replace('ONLINE MODE ACTION: ', '');

      if (index === firstIndex) {
        return '```Online\n' + content;
      } else if (index === lastIndex) {
        return content + '\n ``` \n';
      } else {
        return content;
      }
    } else {
      return line;
    }
  });

  return modifiedLines.join('\n');
}
