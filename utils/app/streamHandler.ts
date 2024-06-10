import { removeLastLine as removeLastLineF } from './../../utils/app/ui';

import { MjJob } from '@/types/mjJob';

import GeneralHtmlComponentParser from '@/components/Chat/components/GeneralHtmlComponentParser';
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
  return async (text: string, removeLastLine?: boolean) => {
    if (removeLastLine) {
      await writer.write(encoder.encode('[REMOVE_LAST_LINE]'));
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
    prompt,
  }: MjImageSelectorV2Props) => {
    const html = await generateComponentHTML({
      component: MjImageSelectorV2,
      props: {
        buttonMessageId,
        imageUrl,
        buttons,
        prompt,
      },
    });
    return writeToStream(html);
  };
};

export class MjProgressProgressHandler {
  private progressContent = '';

  constructor(private writeToStream: WriteToStream) {}

  public async updateProgress({
    content,
    state = 'loading',
    removeLastLine = false,
    percentage,
    errorMessage,
  }: {
    content: string;
    state?: 'loading' | 'completed' | 'error';
    removeLastLine?: boolean;
    percentage?: `${number}`;
    previewImageUrl?: string;
    errorMessage?: string;
  }) {
    if (removeLastLine) {
      this.progressContent = removeLastLineF(this.progressContent);
    }
    this.progressContent += content;
    const html = await generateComponentHTML({
      component: GeneralHtmlComponentParser,
      props: {
        id: 'MjImageProgress',
        componentState: {
          content: this.progressContent,
          state,
          percentage,
          errorMessage: errorMessage || undefined,
        },
      },
      temp: true,
    });
    await this.writeToStream(html);
  }
}

export class MjQueueJobComponentHandler {
  public async generateComponentHTML({ job }: { job: MjJob }) {
    return await generateComponentHTML({
      component: GeneralHtmlComponentParser,
      props: {
        id: 'MjQueueJob',
        componentState: {
          job,
          identifier: job.jobId,
        },
      },
      temp: true,
    });
  }
}
