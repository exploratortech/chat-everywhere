import {
  IconBolt,
  IconBrain,
  IconBrush,
  IconBuildingBroadcastTower,
  IconNumber4,
  IconPaint,
} from '@tabler/icons-react';
import { IconCheck } from '@tabler/icons-react';

import { PluginID } from '@/types/plugin';

export const PlanDetail = {
  free: {
    features: [
      'Voice input',
      'Share conversations',
      'Folder manager',
      'Prompt manager',
    ],
  },
  pro: {
    features: [
      'Cloud sync',
      'AI speech',
      'Online mode',
      'Conversation mode',
      'GPT-4 (50 response/month + credit)',
      'MidJourney generation (50 images/month + credit)',
      '16K model',
      'LINE connection',
    ],
  },
  ultra: {
    features: [
      'Cloud sync',
      'AI speech',
      'Online mode',
      'Conversation mode',
      '16K model',
      'LINE connection',
      'Unlimited GPT-4',
      'Unlimited MidJourney generation',
      'Chat with document (coming soon)',
    ],
  },
  combinedSimplify: [
    'Cloud sync',
    'GPT-4',
    'MidJourney image generation',
    'AI speech',
    '16K model',
    'LINE connection',
  ],
};

export const FeatureItem = ({ featureName }: { featureName: string }) => (
  <div className="flex flex-row items-center">
    <IconCheck size={16} stroke={1} className="ml-2 mr-1" color="lightgreen" />
    <span>{featureName}</span>
  </div>
);

export const getPluginIcon = (
  pluginId: string | undefined | null,
  iconSize?: number,
) => {
  const size = iconSize || 20;
  if (!pluginId) {
    return <IconBolt size={20} />;
  }

  switch (pluginId) {
    case PluginID.LANGCHAIN_CHAT:
      return <IconBrain size={size} />;
    case PluginID.GPT4:
      return <IconNumber4 size={size} />;
    case PluginID.IMAGE_GEN:
      return <IconPaint size={size} />;
    case PluginID.aiPainter:
      return <IconBrush size={size} />;
    case PluginID.mqtt:
      return <IconBuildingBroadcastTower size={size} />;
    default:
      return <IconBolt size={size} />;
  }
};

export const markSurveyIsFilledInLocalStorage = () =>
  localStorage.setItem('surveyIsFilled', 'true');

export const getIsSurveyFilledFromLocalStorage = () =>
  localStorage.getItem('surveyIsFilled') === 'true';

const isObject = (obj: any): boolean => {
  return obj !== null && typeof obj === 'object';
};

export const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) {
    return true;
  }

  if (isObject(obj1) && isObject(obj2)) {
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
      return false;
    }

    for (const key in obj1) {
      if (!(key in obj2)) {
        return false;
      }
      if (!deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
};

export const removeSecondLastLine = (originalText: string): string => {
  const lastNewLineIndex = originalText.lastIndexOf('\n');
  const toBeRemovedLineEndAt = originalText.lastIndexOf(
    '\n',
    lastNewLineIndex - 1,
  );
  const toBeRemovedLineBeginAt = originalText.lastIndexOf(
    '\n',
    toBeRemovedLineEndAt - 1,
  );
  const toBeRemovedString = originalText.substring(
    toBeRemovedLineBeginAt,
    toBeRemovedLineEndAt,
  );

  return originalText.replace(toBeRemovedString, '');
};

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const removeLastLine = (originalText: string): string => {
  const lastNewLineIndex = originalText.lastIndexOf('\n');
  const toBeRemovedLineBeginAt = originalText.lastIndexOf(
    '\n',
    lastNewLineIndex - 1,
  );
  const toBeRemovedString = originalText.substring(toBeRemovedLineBeginAt);

  return originalText.replace(toBeRemovedString, '\n');
};
