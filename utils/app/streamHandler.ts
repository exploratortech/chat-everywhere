import { removeLastLine as removeLastLineF } from './../../utils/app/ui';

import MjImageProgress from '@/components/Chat/components/MjImageProgress';
import MjImageSelector, {
  MjImageSelectorProps,
} from '@/components/Chat/components/MjImageSelector';
import MjImageSelectorV2, {
  MjImageSelectorV2Props,
} from '@/components/Chat/components/MjImageSelectorV2';

import { generateComponentHTML } from './htmlStringHandler';

export const makeWriteToStream = (
  writer: WritableStreamDefaultWriter<any>,
  encoder: TextEncoder,
) => {
  return async (
    text: string,
    removeLastLine?: boolean,
    replaceAll?: boolean,
  ) => {
    if (removeLastLine) {
      await writer.write(encoder.encode('[REMOVE_LAST_LINE]'));
    }
    if (replaceAll) {
      await writer.write(encoder.encode('[REPLACE_ALL]'));
    }
    await writer.write(encoder.encode(text));
  };
};

export type WriteToStream = ReturnType<typeof makeWriteToStream>;

export const makeCreateImageSelectorV2 = (writeToStream: WriteToStream) => {
  return async ({
    buttonMessageId,
    imageUrl,
    buttons,
    previousButtonCommand,
    prompt,
  }: MjImageSelectorV2Props) => {
    const html = await generateComponentHTML({
      component: MjImageSelectorV2,
      props: {
        buttonMessageId,
        imageUrl,
        buttons,
        previousButtonCommand,
        prompt,
      },
    });
    return writeToStream(html);
  };
};
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
    previewImageUrl?: string;
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
