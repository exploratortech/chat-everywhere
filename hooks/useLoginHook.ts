import { Session, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Dispatch, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { updateUserInfo } from '@/utils/app/eventTracking';
import { userProfileQuery } from '@/utils/server/supabase';

import { User } from '@/types/user';

import { HomeInitialState } from '@/components/home/home.state';

import useTeacherPromptForStudent from './teacherPortal/useTeacherPromptForStudent';
import useTeacherSettingsForStudent from './teacherPortal/useTeacherSettingsForStudent';
import { ActionType } from './useCreateReducer';

const useLoginHook = (
  user: User | null,
  dispatch: Dispatch<ActionType<HomeInitialState>>,
) => {
  const { t } = useTranslation('chat');

  const supabase = useSupabaseClient();
  const { refetch: fetchTeacherPrompts } = useTeacherPromptForStudent();
  const { refetch: fetchTeacherSettings } = useTeacherSettingsForStudent();

  const handleUserProfileUpdate = (session: Session) => {
    userProfileQuery({ client: supabase, userId: session.user.id })
      .then((userProfile) => {
        if (!userProfile) return;
        dispatch({ field: 'showLoginSignUpModel', value: false });
        dispatch({ field: 'showOneTimeCodeLoginModel', value: false });
        dispatch({
          field: 'isPaidUser',
          value: userProfile.plan !== 'free',
        });
        dispatch({ field: 'isTempUser', value: userProfile.isTempUser });
        if (userProfile.isTempUser || userProfile.isTeacherAccount) {
          fetchTeacherPrompts().then((res) => {
            if (res.data) {
              dispatch({
                field: 'teacherPrompts',
                value: res.data.prompts,
              });
            }
          });
        }
        if (userProfile.isTempUser) {
          fetchTeacherSettings().then((res) => {
            if (res.data) {
              dispatch({
                field: 'teacherSettings',
                value: res.data.settings,
              });
            }
          });
        }
        dispatch({
          field: 'isTeacherAccount',
          value: userProfile.isTeacherAccount,
        });
        dispatch({
          field: 'isUltraUser',
          value: userProfile.plan === 'ultra',
        });
        dispatch({
          field: 'hasMqttConnection',
          value: userProfile.hasMqttConnection,
        });
        dispatch({
          field: 'isConnectedWithLine',
          value: userProfile.isConnectedWithLine,
        });
        dispatch({
          field: 'user',
          value: {
            id: session.user.id,
            email: session.user.email,
            plan: userProfile.plan || 'free',
            token: session.access_token,
            referralCode: userProfile.referralCode,
            referralCodeExpirationDate: userProfile.referralCodeExpirationDate,
            proPlanExpirationDate: userProfile.proPlanExpirationDate,
            hasReferrer: userProfile.hasReferrer,
            hasReferee: userProfile.hasReferee,
            isInReferralTrial: userProfile.isInReferralTrial,
          },
        });

        updateUserInfo({
          id: userProfile.id,
          email: userProfile.email,
          plan: userProfile.plan || 'free',
          associatedTeacherId: userProfile.associatedTeacherId,
          isTeacherAccount: userProfile.isTeacherAccount,
          isTempUser: userProfile.isTempUser,
          tempUserUniqueId: userProfile.tempUserUniqueId,
        });
      })
      .catch((error) => {
        console.log(error);
        toast.error(
          t('Unable to load your information, please try again later.'),
        );
      })
      .finally(() => {
        dispatch({ field: 'appInitialized', value: true });
      });
  };



  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        // handle initial session
        if (!session) {
          dispatch({ field: 'appInitialized', value: true });
        } else {
          handleUserProfileUpdate(session);
        }
      } else if (event === 'SIGNED_IN') {
        if (session?.user && !user) {
          // User info has been updated for this session
          handleUserProfileUpdate(session);
        }
      } else if (event === 'SIGNED_OUT') {
        // handle sign out event
      } else if (event === 'PASSWORD_RECOVERY') {
        // handle password recovery event
      } else if (event === 'TOKEN_REFRESHED') {
        // handle token refreshed event
      } else if (event === 'USER_UPDATED') {
        // handle user updated event
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
export default useLoginHook;
