import {
  IconBrandFacebook,
  IconBrandGoogle,
  IconCurrencyDollar,
  IconFolder,
  IconHighlight,
  IconLogin,
  IconNews,
  IconSettings,
} from '@tabler/icons-react';
import { useContext, useMemo } from 'react';

import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

import { getNonDeletedCollection } from '@/utils/app/conversation';
import { trackEvent } from '@/utils/app/eventTracking';

import CloudSyncStatusComponent from '../../Sidebar/components/CloudSyncComponent';
import UserAccountBadge from '@/components/User/UserAccountBadge';
import HomeContext from '@/components/home/home.context';
import PreviewVersionFlag from '@/components/ui/preview-version-flag';

import { SidebarButton } from '../../Sidebar/SidebarButton';
import { ClearConversations } from './ClearConversations';

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar');

  const {
    state: {
      conversations,
      folders,
      prompts,
      user,
      isTeacherAccount,
      featureFlags,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const isProUser = user && user.plan === 'pro';
  const isEduUser = user && user.plan === 'edu';
  const isUltraUser = user && user.plan === 'ultra';
  const isChatWithDocEnabled = featureFlags['enable-chat-with-doc'];

  const filteredConversations = useMemo(
    () => getNonDeletedCollection(conversations),
    [conversations],
  );

  const filteredFolders = useMemo(
    () =>
      getNonDeletedCollection(folders).filter(
        (folder) => folder.type === 'chat',
      ),
    [folders],
  );

  const filteredPromptFolders = useMemo(
    () =>
      getNonDeletedCollection(folders).filter(
        (folder) => folder.type === 'prompt',
      ),
    [folders],
  );
  const filteredPrompts = useMemo(
    () => getNonDeletedCollection(prompts),
    [prompts],
  );

  const signInOnClick = () => {
    trackEvent('Sign in button clicked');
    homeDispatch({
      field: 'showLoginSignUpModel',
      value: true,
    });
  };

  const referralBtnOnClick = () => {
    if (isEduUser) {
      homeDispatch({
        field: 'showReferralModel',
        value: true,
      });
    }
  };

  const router = useRouter();
  const teacherPortalBtnOnClick = () => {
    if (isTeacherAccount) {
      trackEvent('Teacher portal clicked');
      router.push('/teacher-portal/one-time-code');
    }
  };

  return (
    <div className="min-h-min">
      <CloudSyncStatusComponent />
      <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm overflow-auto">
        {filteredConversations.length > 0 ||
        filteredFolders.length > 0 ||
        filteredPromptFolders.length > 0 ||
        filteredPrompts.length > 0 ? (
          <ClearConversations />
        ) : null}

        {isUltraUser && isChatWithDocEnabled && (
          <SidebarButton
            text={`${t('File Portal')}`}
            icon={<IconFolder size={18} />}
            onClick={() => {
              homeDispatch({
                field: 'showFilePortalModel',
                value: true,
              });
            }}
            suffixIcon={<PreviewVersionFlag />}
          />
        )}
        <SidebarButton
          text={t('Settings')}
          icon={<IconSettings size={18} />}
          suffixIcon={<UserAccountBadge />}
          onClick={() => {
            homeDispatch({
              field: 'showSettingsModel',
              value: true,
            });
          }}
        />

        {!user && (
          <SidebarButton
            text={t('Sign in')}
            icon={<IconLogin size={18} />}
            suffixIcon={
              <IconBrandGoogle size={18} color="#DB4437" stroke={3} />
            }
            onClick={signInOnClick}
          />
        )}

        {isTeacherAccount && (
          <SidebarButton
            text={t('Teacher Portal')}
            icon={<IconHighlight size={18} />}
            onClick={() => teacherPortalBtnOnClick()}
          />
        )}

        {isEduUser && (
          <SidebarButton
            text={t('Referral Program')}
            icon={<IconCurrencyDollar size={18} />}
            onClick={() => referralBtnOnClick()}
          />
        )}
        {isProUser && (
          <SidebarButton
            text={t('Usage & credit')}
            icon={<IconCurrencyDollar size={18} />}
            onClick={() => {
              trackEvent('Usages & credit clicked');
              homeDispatch({
                field: 'showUsageModel',
                value: true,
              });
            }}
          />
        )}
        {!user && (
          <SidebarButton
            className="flex-grow"
            text={t('One-time code login')}
            icon={<IconNews size={18} />}
            onClick={() => {
              homeDispatch({
                field: 'showOneTimeCodeLoginModel',
                value: true,
              });
            }}
          />
        )}

        <div className="flex w-full">
          <SidebarButton
            className="flex-grow"
            text={t('Latest Updates')}
            icon={<IconNews size={18} />}
            onClick={() => {
              trackEvent('Latest updates clicked');
              homeDispatch({
                field: 'showNewsModel',
                value: true,
              });
            }}
          />
          <SidebarButton
            className="w-min"
            icon={<IconBrandFacebook size={18} />}
            onClick={() => {
              window.open(
                'https://www.facebook.com/groups/621367689441014',
                '_blank',
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};
