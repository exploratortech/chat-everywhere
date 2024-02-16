import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type AdditionalServerSideProps = (
  context: GetServerSidePropsContext,
) => Promise<{
  [key: string]: any;
}>;

export const withCommonServerSideProps =
  (additionalLogic?: AdditionalServerSideProps): GetServerSideProps =>
  async (context): Promise<GetServerSidePropsResult<any>> => {
    const { locale } = context;
    const commonProps = {
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'model',
        'markdown',
        'promptbar',
        'prompts',
        'roles',
        'rolesContent',
        'feature',
        'survey',
        'news',
        'features',
        'auth',
        'mjImage',
        'imageToPrompt',
      ])),
    };

    let additionalProps = {};
    if (additionalLogic) {
      additionalProps = await additionalLogic(context);
    }

    return {
      props: {
        ...commonProps,
      },
      ...additionalProps,
    };
  };
