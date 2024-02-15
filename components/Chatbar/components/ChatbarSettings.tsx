import {
  IconBrandFacebook,
  IconBrandGoogle,
  IconCurrencyDollar,
  IconHighlight,
  IconLogin,
  IconNews,
  IconSettings,
} from '@tabler/icons-react';
import { useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { trackEvent } from '@/utils/app/eventTracking';

import HomeContext from '@/components/home/home.context';

import CloudSyncStatusComponent from '../../Sidebar/components/CloudSyncComponent';
import UserAccountBadge from '@/components/User/UserAccountBadge';

import { SidebarButton } from '../../Sidebar/SidebarButton';
import ChatbarContext from '../Chatbar.context';
import { ClearConversations } from './ClearConversations';

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar');

  const {
    state: { conversations, user, isTeacherAccount },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const { handleClearConversations } = useContext(ChatbarContext);

  const isProUser = user && user.plan === 'pro';
  const isEduUser = user && user.plan === 'edu';

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

  const teacherPortalBtnOnClick = () => {
    if (isTeacherAccount) {
      // TODO:
    }
  };

  return (
    <div className="min-h-min">
      <CloudSyncStatusComponent />
      <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm overflow-auto">
        {conversations.length > 0 ? (
          <ClearConversations onClearConversations={handleClearConversations} />
        ) : null}

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
