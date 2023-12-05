import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import type { mqttConnectionType, newMqttConnectionType } from '@/types/data';

import HomeContext from '@/pages/api/home/home.context';

const StyledButton = ({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`
    rounded-md border border-white/20 p-3 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10
      ${className}
    `}
    {...props}
  >
    {children}
  </button>
);

const StyledInput = ({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={`flex flex-col my-2 ${className}`}>
    <span className="text-sm mb-1">{props.placeholder}</span>
    <input
      className="flex-1 rounded-md border border-neutral-600 bg-[#202123] px-4 py-3 pr-10 text-[14px] leading-3 text-white"
      type="text"
      {...props}
    />
  </div>
);

const StyledToggle = ({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={`flex flex-col my-2 items-center ${className}`}>
    <span className="text-sm mb-1">{props.placeholder}</span>
    <input
      className="flex-1 rounded-md border border-neutral-600 bg-[#202123] px-4 py-3 pr-10 leading-3 text-white w-3"
      type="checkbox"
      {...props}
    />
  </div>
);

export default function Settings_MQTT() {
  const { t } = useTranslation('model');
  const {
    state: { user, isPaidUser },
  } = useContext(HomeContext);
  const [loading, setLoading] = useState(true);
  const [mqttConnections, setMqttConnections] = useState<mqttConnectionType[]>(
    [],
  );
  const [newConnection, setNewConnection] =
    useState<newMqttConnectionType | null>(null);
  const [sendingTestRequest, setSendingTestRequest] = useState(false);

  const supabase = useSupabaseClient();
  const session = useSession();

  const fetchMQTTConnections = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mqtt_connections')
        .select('*')
        .eq('uuid', user.id);
      if (error) throw error;
      // handle the data as needed
      const processedData = data?.map((connection) => ({
        ...connection,
        dynamicInput: connection.dynamic_input,
      }));
      setMqttConnections(processedData);
    } catch (error) {
      console.error('Error fetching MQTT connections: ', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMQTTConnections();
  }, []);

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newConnection) {
      if (
        !newConnection.topic ||
        !newConnection.payload ||
        !newConnection.description ||
        !newConnection.name
      ) {
        toast.error(t('All fields are required'));
        return;
      }
      try {
        const dbRecord = {
          ...newConnection,
          uuid: user?.id,
          dynamic_input: newConnection.dynamicInput,
        };
        delete dbRecord.dynamicInput;

        const { error } = await supabase
          .from('mqtt_connections')
          .insert([dbRecord]);
        if (error) throw error;

        await fetchMQTTConnections();
        toast.success(t('Connection added successfully'));
        setNewConnection(null);
      } catch (error) {
        console.error('Error adding MQTT connection: ', error);
      }
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mqtt_connections')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMqttConnections(
        mqttConnections.filter((connection) => connection.id !== id),
      );
    } catch (error) {
      console.error('Error deleting MQTT connection: ', error);
    }
  };

  const handleUpdateConnection = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    const connectionToUpdate = mqttConnections.find(
      (connection) => connection.id === id,
    );
    if (connectionToUpdate) {
      const dbRecord = {
        ...connectionToUpdate,
        dynamic_input: connectionToUpdate.dynamicInput,
      };
      delete dbRecord.dynamicInput;

      try {
        const { error } = await supabase
          .from('mqtt_connections')
          .update(dbRecord)
          .match({ id: connectionToUpdate.id })
          .single();

        if (error) {
          toast.error(
            t('Error updating MQTT connection, please try again later'),
          );
          return;
        }
        setMqttConnections(
          mqttConnections.map((connection) =>
            connection.id === connectionToUpdate.id
              ? connectionToUpdate
              : connection,
          ),
        );
        toast.success(t('Connection updated successfully'));
      } catch (error) {
        console.error('Error updating MQTT connection: ', error);
      }
    }
  };

  const testConnectionOnClick = async (id: string) => {
    const connectionToTest = mqttConnections.find(
      (connection) => connection.id === id,
    );

    if (connectionToTest) {
      setSendingTestRequest(true);
      try {
        const response = await fetch('/api/mqtt/send-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-token': session?.access_token || '',
          },
          body: JSON.stringify({
            topic: connectionToTest.topic,
            message: connectionToTest.payload,
          }),
        });

        if (response.status === 200) {
          toast.success(t('Connection tested successfully'));
          setSendingTestRequest(false);
          return;
        }

        if (response.status === 500) {
          toast.error(t('Internal server error, please try again later'));
          setSendingTestRequest(false);
          return;
        }

        toast.error(t('Connection failed'));
        setSendingTestRequest(false);
      } catch (error) {
        toast.error(t('Connection failed'));
      }
    }
  };

  const handleInputChange = (
    id: string,
    key: keyof mqttConnectionType,
    value: string | boolean,
  ) => {
    setMqttConnections(
      mqttConnections.map((conn) =>
        conn.id === id ? { ...conn, [key]: value } : conn,
      ),
    );
  };

  if (!user || !isPaidUser) return <></>;

  return (
    <div>
      <h1 className="font-bold mb-4">{t('MQTT')}</h1>
      <p className="text-sm text-gray-500 mb-2">
        {t(
          '(Advance user only) Send MQTT payload to your IoT devices. Integrate AI into your control network.',
        )}
      </p>

      {loading && <p>{t('Loading ...')}</p>}

      <h2 className="font-bold mb-2">{t('Edit Connections')}</h2>
      {mqttConnections.map((connection) => (
        <div key={connection.id} className="mb-4">
          <form
            onSubmit={(e) => handleUpdateConnection(connection.id, e)}
            className="flex flex-col"
          >
            <StyledInput
              value={connection.name || ''}
              onChange={(e) =>
                handleInputChange(connection.id, 'name', e.target.value)
              }
              placeholder={t('Name') || ''}
            />
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
                className="grow-0 mx-2"
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
            <div className="flex justify-between w-full">
              <div className="flex">
                <StyledButton type="submit">{t('Update')}</StyledButton>
                <StyledButton
                  className="ml-2"
                  onClick={(e) => {
                    e.preventDefault();
                    testConnectionOnClick(connection.id);
                  }}
                  disabled={sendingTestRequest}
                >
                  {sendingTestRequest ? '...' : t('Test request')}
                </StyledButton>
              </div>
              <StyledButton
                className="ml-2 border-red-500 hover:bg-red-500 hover:border-red-500"
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
      ))}

      <hr className="my-4" />
      <form onSubmit={handleAddConnection} className="mb-4 flex flex-col">
        <h2 className="font-bold mb-2">{t('Add Connection')}</h2>
        <StyledInput
          value={newConnection?.name || ''}
          onChange={(e) =>
            setNewConnection({ ...newConnection, name: e.target.value })
          }
          placeholder={t('Name') || ''}
        />
        <StyledInput
          value={newConnection?.description || ''}
          onChange={(e) =>
            setNewConnection({ ...newConnection, description: e.target.value })
          }
          placeholder={t('Description') || ''}
        />
        <StyledInput
          value={newConnection?.topic || ''}
          onChange={(e) =>
            setNewConnection({ ...newConnection, topic: e.target.value })
          }
          placeholder={t('Topic') || ''}
        />
        <div className="flex justify-between">
          <StyledToggle
            checked={newConnection?.dynamicInput || false}
            onChange={(e) =>
              setNewConnection({
                ...newConnection,
                dynamicInput: e.target.checked,
              })
            }
            className="grow-0 mx-2"
            placeholder={t('Dynamic') || ''}
          />
          <StyledInput
            value={newConnection?.payload || ''}
            onChange={(e) =>
              setNewConnection({ ...newConnection, payload: e.target.value })
            }
            placeholder={
              (newConnection?.dynamicInput
                ? t('Payload Description')
                : t('Payload')) || ''
            }
            className="grow"
          />
        </div>
        <StyledButton type="submit" disabled={!newConnection}>
          {t('Add Connection')}
        </StyledButton>
        <span className="text-xs mt-2">
          {t('Currently only support')}
          <a
            href="https://www.emqx.com/en/mqtt/public-mqtt5-broker"
            className="ml-1 underline"
          >
            (Website)
          </a>
          :<span className="italic ml-2">broker.emqx.io</span>
        </span>
      </form>
    </div>
  );
}
