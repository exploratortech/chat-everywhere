import { removeLastLine as removeLastLineF } from './../../utils/app/ui';

import MjImageProgress from '@/components/Chat/components/MjImageProgress';
import MjImageSelector, {
  MjImageSelectorProps,
} from '@/components/Chat/components/MjImageSelector';

import { generateComponentHTML } from './htmlStringHandler';

export const makeWriteToStream = (
  writer: WritableStreamDefaultWriter<any>,
  encoder: TextEncoder,
) => {
  return async (text: string, removeLastLine?: boolean) => {
    if (removeLastLine) {
      await writer.write(encoder.encode('[REMOVE_LAST_LINE]'));
    }
    await writer.write(encoder.encode(text));
  };
};

export type WriteToStream = ReturnType<typeof makeWriteToStream>;

export const makeCreateImageSelector = (writeToStream: WriteToStream) => {
  return async ({
    buttonMessageId,
    imageList,
    previousButtonCommand,
    prompt,
  }: MjImageSelectorProps) => {
    const html = await generateComponentHTML({
      component: MjImageSelector,
      props: {
        buttonMessageId,
        imageList,
        previousButtonCommand,
        prompt,
      },
    });
    return writeToStream(html);
  };
};

export class ProgressHandler {
  private progressContent = '';

  constructor(private writeToStream: WriteToStream) {}

  public async updateProgress({
    content,
    state = 'loading',
    removeLastLine = false,
    percentage,
  }: {
    content: string;
    state?: 'loading' | 'completed' | 'error';
    removeLastLine?: boolean;
    percentage?: `${number}`;
  }) {
    if (removeLastLine) {
      this.progressContent = removeLastLineF(this.progressContent);
    }
    this.progressContent += content;
    const html = await generateComponentHTML({
      component: MjImageProgress,
      props: {
        content: this.progressContent,
        state,
        percentage,
      },
      temp: true,
    });
    await this.writeToStream(html);
  }
}
