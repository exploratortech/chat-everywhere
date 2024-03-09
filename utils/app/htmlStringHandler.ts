// use in edge only
import { ComponentClass, FunctionComponent, createElement } from 'react';
import { renderToReadableStream } from 'react-dom/server';

interface GetHtmlStringProps {
  component: string | FunctionComponent<any> | ComponentClass<any, any>;
  props?: any;
  temp?: boolean;
}
export async function generateComponentHTML({
  component,
  props,
  temp = false,
}: GetHtmlStringProps) {
  const htmlStream = await renderToReadableStream(
    createElement(component, props),
    {},
  );
  const reader = htmlStream.getReader();
  const decoder = new TextDecoder();

  let html = '';
  let done = false;
  while (!done) {
    const { done: readerDone, value } = await reader.read();
    done = readerDone; // Update the done flag with the readerDone value
    if (done) break;
    html += decoder.decode(value); // Decode the Uint8Array chunk to a string and append it
  }
  if (temp) {
    return (
      '\n\n <!-- Temp HTML start --> ' + html + '<!-- Temp HTML end --> \n\n'
    );
  } else {
    return '\n\n ' + html + ' \n\n';
  }
}

export function removeTempHtmlString(
  content: string,
  replaceString: string = '',
) {
  content = content.replace(
    "[REMOVE_TEMP_HTML]",'',
  );
  content = content.replace(
    /<!-- Temp HTML start -->(.*?)<!-- Temp HTML end -->/gs,
    replaceString,
  );
  return content;
}
export function removeRedundantTempHtmlString(content: string) {
  const pattern = /<!-- Temp HTML start -->(.*?)<!-- Temp HTML end -->/gs;
  const matches = content.match(pattern);
  if (matches && matches.length > 1) {
    // replace all occurrences
    content = content.replace(pattern, '');
    // append the last one
    content += matches[matches.length - 1];
  }
  return content;
}
