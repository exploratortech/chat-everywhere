// use in edge only
import { ComponentClass, FunctionComponent, createElement } from 'react';
import { renderToReadableStream } from 'react-dom/server';

interface GetHtmlStringProps {
  component: string | FunctionComponent<any> | ComponentClass<any, any>;
  props?: any;
}
export async function generateComponentHTML({
  component,
  props,
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
  return html;
}
