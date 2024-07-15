import { Dialog, Transition } from '@headlessui/react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { FC } from 'react';
import { Fragment, useContext, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { markSurveyIsFilledInLocalStorage } from '@/utils/app/ui';
import { getOrGenerateUserId } from '@/utils/data/taggingHelper';

import HomeContext from '@/components/home/home.context';

type Props = {
  onClose: () => void;
};

interface Options {
  value: string;
  label: string;
}

export const SurveyModel: FC<Props> = ({ onClose }) => {
  const { t } = useTranslation('survey');
  const {
    state: { user },
  } = useContext(HomeContext);
  const supabaseClient = useSupabaseClient();

  const occupationOptions = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher / Professor / Educator' },
    { value: 'creative', label: 'Artist / Writer / Influencer / Youtuber' },
    { value: 'engineer', label: 'Engineer' },
    { value: 'it_professional', label: 'IT professional' },
    {
      value: 'tradesperson',
      label: 'Tradesperson (e.g. plumber, electrician, carpenter)',
    },
    { value: 'retail_salesperson', label: 'Retail worker / salesperson' },
    { value: 'manager_executive', label: 'Manager / Executive' },
    { value: 'self_employed', label: 'Self-employed / Business Owner' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'homemaker', label: 'Homemaker' },
    { value: 'retired', label: 'Retired' },
    { value: 'prefer_no_answer', label: 'I prefer not to answer' },
    { value: 'other_occupation', label: 'Other' },
  ];

  const useCaseOptions = [
    { value: 'education', label: 'Education or Training Purposes' },
    { value: 'homework', label: 'Help with homework' },
    { value: 'content_creation', label: 'Content creation' },
    { value: 'coding', label: 'Programming / Coding' },
    { value: 'grammar', label: 'Grammar and writing check' },
    { value: 'translation', label: 'Translation' },
    { value: 'complex_problem', label: 'Complex problem solving' },
    { value: 'google_alternative', label: 'Alternative to Google search' },
    { value: 'other_usecase', label: 'Other' },
  ];

  const featuresOptions = [
    { value: 'folder', label: 'Folders' },
    { value: 'prompts', label: 'Save Prompts' },
    { value: 'share', label: 'Share Conversations' },
    { value: 'import_export', label: 'Import / Export Data' },
    { value: 'online', label: 'Online Mode' },
    { value: 'cloud_sync', label: 'Cloud Sync (Pro Plan)' },
    { value: 'gpt_4', label: 'GPT-4 integration (Pro Plan)' },
    { value: 'ai_speech', label: 'AI Speech (Pro Plan)' },
    { value: 'image', label: 'AI image generation' },
    { value: 'other_feature', label: 'Other' },
  ];

  const preferredOptions = [
    { value: 'not_preferred', label: 'Not A Preferred Choice Yet' },
    { value: 'restriction', label: 'ChatGPT Is Restricted In Your Region' },
    { value: 'affordable', label: 'Affordable Pro Plan' },
    {
      value: 'additional_features',
      label: 'Additional Features (Folders, Prompts, Share...)',
    },
    { value: 'no_login', label: 'No Login / Sign up Required' },
    { value: 'not_sure', label: "I'm Not Entirely Certain" },
    { value: 'other_preferred', label: 'Other' },
  ];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedOccupation, setSelectedOccupation] = useState('');
  const [otherOccupation, setOtherOccupation] = useState('');
  const [selectedUseCases, setSelectedUseCases] = useState<Options[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<Options[]>([]);
  const [selectedPreferred, setSelectedPreferred] = useState<Options[]>([]);
  const [comment, setComment] = useState('');

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    stateVar: any,
    setStateVar: React.Dispatch<React.SetStateAction<any>>,
  ) => {
    const { value, checked } = event.target;
    setStateVar((prev: any) => {
      const newState = Object.entries({
        ...prev,
        [value]: checked,
      })
        .filter(([value]) => value)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}) as {
        value: string;
        label: string;
      }[];
      stateVar === selectedUseCases && setSelectedUseCases(newState);
      stateVar === selectedFeatures && setSelectedFeatures(newState);
      stateVar === selectedPreferred && setSelectedPreferred(newState);
      return newState;
    });
  };

  const handleSubmit = async () => {
    // Validation check
    if (
      name == '' ||
      selectedOccupation.length === 0 ||
      (selectedOccupation === 'other_occupation' && otherOccupation === '')
    ) {
      if (name == '') {
        const nameInput = document.getElementById('name') as HTMLInputElement;
        nameInput.style.borderColor = 'red';

        const errorLabel = document.getElementById(
          'error-name',
        ) as HTMLInputElement;
        errorLabel.style.display = 'block';
      } else {
        const occInput = document.getElementById(
          'occupation',
        ) as HTMLInputElement;
        occInput.style.borderColor = 'red';

        const errorLabel = document.getElementById(
          'error-occupation',
        ) as HTMLInputElement;
        errorLabel.style.display = 'block';
      }
      return;
    }
    //Supabase query
    try {
      const { error } = await supabaseClient.from('user_survey').insert({
        uid: user?.id,
        non_login_uid: getOrGenerateUserId(),
        name: name,
        occupation:
          selectedOccupation === 'other_occupation'
            ? otherOccupation
            : selectedOccupation,
        email: email,
        use_case: selectedUseCases,
        value_features: selectedFeatures,
        preferred_choice: selectedPreferred,
        comments: comment,
      });
      if (error) {
        toast.error(t('Something went wrong. Please try again.'));
        return;
      }
      toast.success(t('Thanks for completing the survey!'), {
        duration: 5000,
      });
      markSurveyIsFilledInLocalStorage();
      onClose();
    } catch (err) {
      toast.error(t('Something went wrong. Please try again.'));
    }
  };

  const OptionLabels = ({ option }: { option: string }) => (
    <span>{t(option)}</span>
  );

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} open>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl bg-neutral-800 p-6 text-left align-middle text-white shadow-xl transition-all md:max-w-lg">
                <Dialog.Description>
                  <div className="flex flex-col rounded-2xl">
                    <span className="mb-6 text-lg">
                      {t(
                        'Please share your thoughts by completing a brief survey',
                      )}
                    </span>

                    <div className="h-96 w-full overflow-y-scroll">
                      {/* 1. Name */}
                      <div className="mb-4">
                        <label
                          htmlFor="name"
                          className="mb-2 block text-base text-stone-400"
                        >
                          {t('Name (required)')}
                        </label>
                        <label
                          id="error-name"
                          className="mb-1 hidden text-sm text-rose-500"
                        >
                          {t('Please enter name')}
                        </label>
                        <input
                          type="text"
                          id="name"
                          placeholder={t('John Smith') || 'John Smith'}
                          className="mb-6 block w-11/12 rounded border bg-inherit px-4 py-2 text-sm leading-tight focus:border-2 focus:outline-none"
                          maxLength={50}
                          onChange={(event) => setName(event.target.value)}
                        />
                      </div>

                      {/* 2. Occupation */}
                      <div className="mb-4">
                        <label
                          htmlFor="occupation"
                          className="mb-2 block text-base text-stone-400"
                        >
                          {t('Occupation (required)')}
                        </label>
                        <label
                          id="error-occupation"
                          className="mb-1 hidden text-sm text-rose-500"
                        >
                          {t('Please select your occupation')}
                        </label>
                        <select
                          id="occupation"
                          className="mb-6 block w-11/12 rounded border bg-inherit px-4 py-2 text-sm leading-tight focus:border-2 focus:outline-none"
                          value={selectedOccupation}
                          onChange={(event) =>
                            setSelectedOccupation(event.target.value)
                          }
                        >
                          <option value="" className="bg-[#343541] text-white">
                            {t('Select an occupation')}
                          </option>
                          {occupationOptions.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              className="bg-[#343541] text-white"
                            >
                              <OptionLabels
                                key={option.value}
                                option={option.label}
                              />
                            </option>
                          ))}
                        </select>
                        {selectedOccupation === 'other_occupation' && (
                          <input
                            type="text"
                            id="otherOccupation"
                            className="block w-11/12 rounded border bg-inherit px-4 py-2 text-sm leading-tight focus:border-2 focus:outline-none"
                            placeholder={
                              t('Please specify') || 'Please specify'
                            }
                            maxLength={100}
                            onChange={(event) =>
                              setOtherOccupation(event.target.value)
                            }
                          />
                        )}
                      </div>

                      {/* 3. Email */}
                      {!user && (
                        <div className="mb-4">
                          <label
                            htmlFor="name"
                            className="mb-2 block text-base text-stone-400"
                          >
                            {t(
                              'Email (optional if you would like to be contacted)',
                            )}
                          </label>
                          <input
                            type="email"
                            className="mb-6 block w-11/12 rounded border bg-inherit px-4 py-2 text-sm leading-tight focus:border-2 focus:outline-none"
                            maxLength={50}
                            onChange={(event) => setEmail(event.target.value)}
                            value={email}
                          />
                        </div>
                      )}

                      {/* 4. UseCase */}
                      <div className="mb-6">
                        <label
                          htmlFor="useCase"
                          className="mb-2 block text-base text-stone-400"
                        >
                          {t('What Do You Use Chat Everywhere For?')}
                        </label>
                        {useCaseOptions.map((option) => (
                          <div key={option.value}>
                            <input
                              type="checkbox"
                              id={option.value}
                              value={option.value}
                              onChange={(event) =>
                                handleCheckboxChange(
                                  event,
                                  selectedUseCases,
                                  setSelectedUseCases,
                                )
                              }
                            />
                            <label
                              htmlFor={option.value}
                              className="px-2 text-sm"
                            >
                              <OptionLabels
                                key={option.value}
                                option={option.label}
                              />
                            </label>
                            {option.value === 'other_usecase' &&
                              selectedUseCases[
                                option.value as keyof typeof selectedUseCases
                              ] && (
                                <input
                                  type="text"
                                  id="otherUseCase"
                                  className="mb-3 mt-1 block w-11/12 rounded border bg-inherit px-4 py-2 text-sm leading-tight focus:border-2 focus:outline-none"
                                  placeholder={
                                    t('Please specify') || 'Please specify'
                                  }
                                  maxLength={100}
                                  onChange={(event) =>
                                    setSelectedUseCases((prev: any) => ({
                                      ...prev,
                                      [option.value]: event.target.value,
                                    }))
                                  }
                                />
                              )}
                          </div>
                        ))}
                      </div>

                      {/* 5. Features */}
                      <div className="mb-6">
                        <label
                          htmlFor="features"
                          className="mb-2 block text-base text-stone-400"
                        >
                          {t(
                            'Which Chat Everywhere features appeal to you the most?',
                          )}
                        </label>
                        {featuresOptions.map((option) => (
                          <div key={option.value}>
                            <input
                              type="checkbox"
                              id={option.value}
                              value={option.value}
                              onChange={(event) =>
                                handleCheckboxChange(
                                  event,
                                  selectedFeatures,
                                  setSelectedFeatures,
                                )
                              }
                            />
                            <label
                              htmlFor={option.value}
                              className="px-2 text-sm"
                            >
                              <OptionLabels
                                key={option.value}
                                option={option.label}
                              />
                            </label>

                            {option.value === 'other_feature' &&
                              selectedFeatures[
                                option.value as keyof typeof selectedUseCases
                              ] && (
                                <input
                                  type="text"
                                  id="otherFeature"
                                  className="mb-3 mt-1 block w-11/12 rounded border bg-inherit px-4 py-2 text-sm leading-tight focus:border-2 focus:outline-none"
                                  placeholder={
                                    t('Please specify') || 'Please specify'
                                  }
                                  maxLength={100}
                                  onChange={(event) =>
                                    setSelectedFeatures((prev: any) => ({
                                      ...prev,
                                      [option.value]: event.target.value,
                                    }))
                                  }
                                />
                              )}
                          </div>
                        ))}
                      </div>

                      {/* 6. Preferred */}
                      <div className="mb-6">
                        <label
                          htmlFor="preferred"
                          className="mb-2 block text-base text-stone-400"
                        >
                          {t(
                            'What makes Chat Everywhere your preferred choice over official ChatGPT?',
                          )}
                        </label>
                        {preferredOptions.map((option) => (
                          <div key={option.value}>
                            <input
                              type="checkbox"
                              id={option.value}
                              value={option.value}
                              onChange={(event) =>
                                handleCheckboxChange(
                                  event,
                                  selectedPreferred,
                                  setSelectedPreferred,
                                )
                              }
                            />
                            <label
                              htmlFor={option.value}
                              className="px-2 text-sm"
                            >
                              <OptionLabels
                                key={option.value}
                                option={option.label}
                              />
                            </label>
                            {option.value === 'other_preferred' &&
                              selectedPreferred[
                                option.value as keyof typeof selectedUseCases
                              ] && (
                                <input
                                  type="text"
                                  id="otherPreferred"
                                  className="mb-3 mt-1 block w-11/12 rounded border bg-inherit px-4 py-2 text-sm leading-tight focus:border-2 focus:outline-none"
                                  placeholder={
                                    t('Please specify') || 'Please specify'
                                  }
                                  maxLength={200}
                                  onChange={(event) =>
                                    setSelectedPreferred((prev: any) => ({
                                      ...prev,
                                      [option.value]: event.target.value,
                                    }))
                                  }
                                />
                              )}
                          </div>
                        ))}
                      </div>

                      {/* 7. Comments */}
                      <div className="mb-4">
                        <label
                          htmlFor="comment"
                          className="mb-2 block text-base text-stone-400"
                        >
                          {t(
                            "Is there anything you'd like to tell us? (Optional)",
                          )}
                        </label>

                        <input
                          type="text"
                          id="comment"
                          placeholder={
                            t(
                              'Any comments, feedback or suggestions are welcome!',
                            ) ||
                            'Any comments, feedback or suggestions are welcome!'
                          }
                          className="mb-6 block w-11/12 rounded border bg-inherit px-4 py-2 text-sm leading-tight focus:border-2 focus:outline-none"
                          maxLength={450}
                          onChange={(event) => setComment(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </Dialog.Description>

                <div className="mt-4 flex justify-between">
                  <button
                    type="button"
                    className="rounded-lg border border-neutral-500 px-4 py-2 text-neutral-200 shadow hover:bg-neutral-700 focus:outline-none"
                    onClick={onClose}
                  >
                    {t('Close')}
                  </button>

                  <button
                    type="button"
                    className="rounded-lg border bg-slate-200 px-4 py-2 text-black shadow hover:bg-slate-300 focus:outline-none"
                    onClick={handleSubmit}
                  >
                    {t('Submit')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
