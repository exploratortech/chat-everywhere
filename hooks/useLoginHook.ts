import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { isFeatureEnabled, updateUserInfo } from '@/utils/app/eventTracking';

import HomeContext from '@/components/home/home.context';

import useTeacherPromptForStudent from './teacherPortal/useTeacherPromptForStudent';
import useTeacherSettingsForStudent from './teacherPortal/useTeacherSettingsForStudent';
import useUserProfile from './useUserProfile';

const useLoginHook = () => {
  const { t } = useTranslation('chat');
  const {
    state: { user },
    dispatch,
  } = useContext(HomeContext);
  const session = useSession();
  const supabase = useSupabaseClient();
  const { refetch: fetchUserProfile } = useUserProfile({
    userId: session?.user.id,
  });
  const { refetch: fetchTeacherPrompts } = useTeacherPromptForStudent();
  const { refetch: fetchTeacherSettings } = useTeacherSettingsForStudent();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session);
      if (event === 'INITIAL_SESSION') {
        // handle initial session
      } else if (event === 'SIGNED_IN') {
        if (session?.user) {
          // User info has been updated for this session
          if (session.user.id === user?.id) return;
          fetchUserProfile()
            .then((result) => {
              const userProfile = result.data;
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
                  referralCodeExpirationDate:
                    userProfile.referralCodeExpirationDate,
                  proPlanExpirationDate: userProfile.proPlanExpirationDate,
                  hasReferrer: userProfile.hasReferrer,
                  hasReferee: userProfile.hasReferee,
                  isInReferralTrial: userProfile.isInReferralTrial,
                },
              });

              dispatch({
                field: 'featureFlags',
                value: {
                  // Ignore feature flag on staging and local env
                  'enable-conversation-mode':
                    isFeatureEnabled('enable-conversation-mode') ||
                    process.env.NEXT_PUBLIC_ENV !== 'production',
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
            });

          //Check if survey is filled by logged in user
          supabase
            .from('user_survey')
            .select('name')
            .eq('uid', session.user.id)
            .then(({ data }) => {
              if (!data || data.length === 0) {
                dispatch({ field: 'isSurveyFilled', value: false });
              } else {
                dispatch({ field: 'isSurveyFilled', value: true });
              }
            });
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
  }, []);

  useEffect(() => {
    console.log(session);
    // if (session?.user) {
    //   // User info has been updated for this session
    //   if (session.user.id === user?.id) return;
    //   fetchUserProfile()
    //     .then((result) => {
    //       const userProfile = result.data;
    //       if (!userProfile) return;
    //       dispatch({ field: 'showLoginSignUpModel', value: false });
    //       dispatch({ field: 'showOneTimeCodeLoginModel', value: false });
    //       dispatch({ field: 'isPaidUser', value: userProfile.plan !== 'free' });
    //       dispatch({ field: 'isTempUser', value: userProfile.isTempUser });
    //       if (userProfile.isTempUser || userProfile.isTeacherAccount) {
    //         fetchTeacherPrompts().then((res) => {
    //           if (res.data) {
    //             dispatch({
    //               field: 'teacherPrompts',
    //               value: res.data.prompts,
    //             });
    //           }
    //         });
    //       }
    //       if (userProfile.isTempUser) {
    //         fetchTeacherSettings().then((res) => {
    //           if (res.data) {
    //             dispatch({
    //               field: 'teacherSettings',
    //               value: res.data.settings,
    //             });
    //           }
    //         });
    //       }
    //       dispatch({
    //         field: 'isTeacherAccount',
    //         value: userProfile.isTeacherAccount,
    //       });
    //       dispatch({
    //         field: 'isUltraUser',
    //         value: userProfile.plan === 'ultra',
    //       });
    //       dispatch({
    //         field: 'hasMqttConnection',
    //         value: userProfile.hasMqttConnection,
    //       });
    //       dispatch({
    //         field: 'isConnectedWithLine',
    //         value: userProfile.isConnectedWithLine,
    //       });
    //       dispatch({
    //         field: 'user',
    //         value: {
    //           id: session.user.id,
    //           email: session.user.email,
    //           plan: userProfile.plan || 'free',
    //           token: session.access_token,
    //           referralCode: userProfile.referralCode,
    //           referralCodeExpirationDate:
    //             userProfile.referralCodeExpirationDate,
    //           proPlanExpirationDate: userProfile.proPlanExpirationDate,
    //           hasReferrer: userProfile.hasReferrer,
    //           hasReferee: userProfile.hasReferee,
    //           isInReferralTrial: userProfile.isInReferralTrial,
    //         },
    //       });
    //
    //       dispatch({
    //         field: 'featureFlags',
    //         value: {
    //           // Ignore feature flag on staging and local env
    //           'enable-conversation-mode':
    //             isFeatureEnabled('enable-conversation-mode') ||
    //             process.env.NEXT_PUBLIC_ENV !== 'production',
    //         },
    //       });
    //       updateUserInfo({
    //         id: userProfile.id,
    //         email: userProfile.email,
    //         plan: userProfile.plan || 'free',
    //         associatedTeacherId: userProfile.associatedTeacherId,
    //         isTeacherAccount: userProfile.isTeacherAccount,
    //         isTempUser: userProfile.isTempUser,
    //         tempUserUniqueId: userProfile.tempUserUniqueId,
    //       });
    //     })
    //     .catch((error) => {
    //       console.log(error);
    //       toast.error(
    //         t('Unable to load your information, please try again later.'),
    //       );
    //     });
    //
    //   //Check if survey is filled by logged in user
    //   supabase
    //     .from('user_survey')
    //     .select('name')
    //     .eq('uid', session.user.id)
    //     .then(({ data }) => {
    //       if (!data || data.length === 0) {
    //         dispatch({ field: 'isSurveyFilled', value: false });
    //       } else {
    //         dispatch({ field: 'isSurveyFilled', value: true });
    //       }
    //     });
    // } else {
    //   dispatch({
    //     field: 'isSurveyFilled',
    //     value: getIsSurveyFilledFromLocalStorage(),
    //   });
    // }
  }, [session]);
};
export default useLoginHook;
