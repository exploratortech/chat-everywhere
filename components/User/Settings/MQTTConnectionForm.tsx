import React from 'react';
import { useTranslation } from 'react-i18next';

import type { mqttConnectionType } from '@/types/data';

import {
  StyledButton,
  StyledInput,
  StyledToggle,
} from './SettingStyledComponents';

interface MQTTConnectionFormProps {
  connection: mqttConnectionType;
  editing: boolean;
  handleInputChange: (
    id: string,
    key: keyof mqttConnectionType,
    value: string | boolean,
  ) => void;
  handleUpdateConnection: (id: string, e: React.FormEvent) => void;
  testReceiverOnClick: (id: string) => void;
  testConnectionOnClick: (id: string) => void;
  sendingTestRequest: boolean;
  handleDeleteConnection: (id: string) => void;
  editButtonOnClick: (id: string | null) => void;
}

const SimpleFieldLayout: React.FC<{
  label: string;
  value: string;
  className?: string;
}> = ({ label, value, className }) => (
  <div className={`mb-1 flex flex-col ${className}`}>
    <span className="mb-1 text-sm">{label}</span>
    <p className="p-3 pr-10 text-[14px] leading-3 text-gray-400">{value}</p>
  </div>
);

export const extractAlphabetsAndSpace = (inputString: string) => {
  return inputString.replace(/[^a-zA-Z -]/g, '');
};

export const MQTTConnectionForm: React.FC<MQTTConnectionFormProps> = ({
  editing,
  connection,
  handleInputChange,
  handleUpdateConnection,
  testReceiverOnClick,
  testConnectionOnClick,
  sendingTestRequest,
  handleDeleteConnection,
  editButtonOnClick,
}) => {
  const { t } = useTranslation('model');

  if (editing)
    return (
      <div key={connection.id} className="mb-4">
        <form
          onSubmit={(e) => handleUpdateConnection(connection.id, e)}
          className="flex flex-col"
        >
          <div className="flex justify-between">
            <StyledInput
              value={connection.name || ''}
              onChange={(e) =>
                handleInputChange(
                  connection.id,
                  'name',
                  extractAlphabetsAndSpace(e.target.value),
                )
              }
              placeholder={t('Name (English only)') || ''}
            />
            <StyledToggle
              checked={connection?.receiver || false}
              onChange={(e) =>
                handleInputChange(connection.id, 'receiver', e.target.checked)
              }
              className={`mx-2 grow-0 ${
                connection?.receiver ? 'font-semibold text-red-500' : ''
              }`}
              placeholder={t('Receiver') || ''}
            />
          </div>
          <StyledInput
            value={connection.description || ''}
            onChange={(e) =>
              handleInputChange(connection.id, 'description', e.target.value)
            }
            placeholder={t('Description') || ''}
          />
          <StyledInput
            value={connection.topic || ''}
            onChange={(e) =>
              handleInputChange(connection.id, 'topic', e.target.value)
            }
            placeholder={t('Topic') || ''}
          />
          {!connection.receiver && (
            <div className="flex justify-between">
              <StyledToggle
                checked={connection.dynamicInput || false}
                onChange={(e) =>
                  handleInputChange(
                    connection.id,
                    'dynamicInput',
                    e.target.checked,
                  )
                }
                className="mx-2 grow-0"
                placeholder={t('Dynamic') || ''}
              />
              <StyledInput
                value={connection.payload || ''}
                onChange={(e) =>
                  handleInputChange(connection.id, 'payload', e.target.value)
                }
                placeholder={
                  (connection.dynamicInput
                    ? t('Payload Description')
                    : t('Payload')) || ''
                }
                className="grow"
              />
            </div>
          )}
          <div className="flex w-full justify-between">
            <div className="flex">
              <StyledButton type="submit">{t('Update')}</StyledButton>
              <StyledButton
                className="ml-2"
                onClick={(e) => {
                  e.preventDefault();
                  editButtonOnClick(null);
                }}
              >
                {t('Cancel')}
              </StyledButton>
            </div>
            <StyledButton
              className="ml-2 border-red-500 hover:border-red-500 hover:bg-red-500"
              type="button"
              onClick={() =>
                connection.id && handleDeleteConnection(connection.id)
              }
            >
              {t('Delete')}
            </StyledButton>
          </div>
        </form>
      </div>
    );

  return (
    <div className="mb-4 rounded-sm border border-gray-400 p-4">
      <form
        onSubmit={(e) => handleUpdateConnection(connection.id, e)}
        className="flex flex-col"
      >
        <div className="flex justify-between">
          <SimpleFieldLayout label={t('Name')} value={connection.name || ''} />
          <StyledToggle
            checked={connection?.receiver || false}
            className={`mx-2 grow-0 ${
              connection?.receiver ? 'font-semibold text-red-500' : ''
            }`}
            placeholder={t('Receiver') || ''}
            disabled
          />
        </div>
        <SimpleFieldLayout
          label={t('Description')}
          value={connection.description || ''}
        />
        <SimpleFieldLayout label={t('Topic')} value={connection.topic || ''} />
        {!connection.receiver && (
          <div className="flex items-baseline">
            <StyledToggle
              checked={connection.dynamicInput || false}
              className="mx-2 grow-0"
              placeholder={t('Dynamic') || ''}
              disabled
            />
            <SimpleFieldLayout
              label={
                connection.dynamicInput
                  ? t('Payload Description')
                  : t('Payload')
              }
              value={connection.payload || ''}
              className="grow"
            />
          </div>
        )}

        <div className="flex w-full justify-between">
          <div className="flex">
            <StyledButton
              onClick={(e) => {
                e.preventDefault();
                editButtonOnClick(connection.id);
              }}
            >
              {t('Edit')}
            </StyledButton>
            <StyledButton
              className="ml-2"
              onClick={(e) => {
                e.preventDefault();
                if (connection.receiver) {
                  testReceiverOnClick(connection.id);
                } else {
                  testConnectionOnClick(connection.id);
                }
              }}
              disabled={sendingTestRequest}
            >
              {sendingTestRequest ? '...' : t('Test')}
            </StyledButton>
          </div>
        </div>
      </form>
    </div>
  );
};
