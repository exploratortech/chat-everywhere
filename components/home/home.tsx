import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useRouter } from 'next/router';

import ClearConversationsModal from '../Chatbar/components/ClearConversationsModal';
import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import FeaturesModel from '@/components/Features/FeaturesModel';
import { Navbar } from '@/components/Mobile/Navbar';
import NewsModel from '@/components/News/NewsModel';
import Promptbar from '@/components/Promptbar';
import { AuthModel } from '@/components/User/AuthModel';
import OneTimeCodeLoginModal from '@/components/User/OneTimeCodeLoginModal';
import ReferralModel from '@/components/User/ReferralModel';
import SettingsModel from '@/components/User/Settings/SettingsModel';
import { SurveyModel } from '@/components/User/SurveyModel';
import { UsageCreditModel } from '@/components/User/UsageCreditModel';
import VoiceInputActiveOverlay from '@/components/Voice/VoiceInputActiveOverlay';

import HomeContext from './home.context';

const Home = () => {
  const router = useRouter();
  const session = useSession();

  const { t } = useTranslation('chat');
  const [containerHeight, setContainerHeight] = useState('100vh');
  const supabase = useSupabaseClient();

  const {
    state: {
      selectedConversation,
      showSettingsModel,
      showLoginSignUpModel,
      showOneTimeCodeLoginModel,
      showReferralModel,
      showUsageModel,
      showSurveyModel,
      showNewsModel,
      showFeaturesModel,
    },
    handleNewConversation,
    stopConversationRef,
    dispatch,
  } = useContext(HomeContext);

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);

      // If you want to set the height directly in the state
      setContainerHeight(`100dvh`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    // Display notice message from url if exist
    const { notice, noticeType } = router.query;
    if (notice) {
      toast.dismiss();
      if (noticeType === 'error') {
        toast.error(t(notice as string));
      } else {
        toast.success(t(notice as string));
      }
      router.replace(router.pathname, router.pathname, { shallow: true });
    }
    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);
  if (!selectedConversation) return null;
  return (
    <main
      className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white `}
      style={{ height: containerHeight }}
    >
      <Navbar
        selectedConversation={selectedConversation}
        onNewConversation={handleNewConversation}
      />

      <div className="flex items-stretch flex-1 w-full overflow-x-hidden">
        <Chatbar />
        <div className="flex flex-1">
          <Chat stopConversationRef={stopConversationRef} />
        </div>
        {showSettingsModel && (
          <SettingsModel
            onClose={() =>
              dispatch({ field: 'showSettingsModel', value: false })
            }
          />
        )}
        {showLoginSignUpModel && (
          <AuthModel
            supabase={supabase}
            onClose={() =>
              dispatch({ field: 'showLoginSignUpModel', value: false })
            }
          />
        )}

        <OneTimeCodeLoginModal
          open={showOneTimeCodeLoginModel}
          onOpen={() =>
            dispatch({
              field: 'showOneTimeCodeLoginModel',
              value: true,
            })
          }
          onClose={() =>
            dispatch({
              field: 'showOneTimeCodeLoginModel',
              value: false,
            })
          }
        />
        <ClearConversationsModal />
        {showReferralModel && (
          <ReferralModel
            onClose={() =>
              dispatch({ field: 'showReferralModel', value: false })
            }
          />
        )}
        {showUsageModel && session && (
          <UsageCreditModel
            onClose={() => dispatch({ field: 'showUsageModel', value: false })}
          />
        )}
        {showSurveyModel && (
          <SurveyModel
            onClose={() => dispatch({ field: 'showSurveyModel', value: false })}
          />
        )}
        <NewsModel
          open={showNewsModel}
          onOpen={() => dispatch({ field: 'showNewsModel', value: true })}
          onClose={() => dispatch({ field: 'showNewsModel', value: false })}
        />
        <FeaturesModel
          open={showFeaturesModel}
          onClose={() => dispatch({ field: 'showFeaturesModel', value: false })}
        />
        <Promptbar />
      </div>
      <VoiceInputActiveOverlay />
    </main>
  );
};
export default Home;
