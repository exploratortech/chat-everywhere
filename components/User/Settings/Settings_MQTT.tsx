import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/pages/api/home/home.context';

type mqttConnectionType = {
  id: string;
  name?: string;
  description?: string;
  topic?: string;
  payload?: string;
};

type newMqttConnectionType = Pick<
  mqttConnectionType,
  'description' | 'topic' | 'payload' | 'name'
>;

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
  <div className="flex flex-col my-2">
    <span className="text-sm mb-1">{props.placeholder}</span>
    <input
      className={`
    flex-1 rounded-md border border-neutral-600 bg-[#202123] px-4 py-3 pr-10 text-[14px] leading-3 text-white
      ${className}
    `}
      type="text"
      {...props}
    />
  </div>
);

export default function Settings_MQTT() {
  const { t } = useTranslation('model');
  const {
    state: { user, isPaidUser },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const [loading, setLoading] = useState(true);
  const [mqttConnections, setMqttConnections] = useState<mqttConnectionType[]>(
    [],
  );
  const [newConnection, setNewConnection] =
    useState<newMqttConnectionType | null>(null);

  const supabase = useSupabaseClient();

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
      setMqttConnections(data);
      console.log(data);
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
      if (!newConnection.topic || !newConnection.payload || !newConnection.description || !newConnection.name) {
        toast.error(t('All fields are required'));
        return;
      }
      try {
        const { error } = await supabase
          .from('mqtt_connections')
          .insert([{ ...newConnection, uuid: user?.id }]);
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
      try {
        const { error } = await supabase
          .from('mqtt_connections')
          .update(connectionToUpdate)
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

  const handleInputChange = (
    id: string,
    key: keyof mqttConnectionType,
    value: string,
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
            <StyledInput
              value={connection.payload || ''}
              onChange={(e) =>
                handleInputChange(connection.id, 'payload', e.target.value)
              }
              placeholder={t('Payload') || ''}
            />
            <div>
              <StyledButton type="submit">
                {t('Update Connection')}
              </StyledButton>
              <StyledButton
                className="ml-2 border-red-500 hover:bg-red-500 hover:border-red-500"
                type="button"
                onClick={() =>
                  connection.id && handleDeleteConnection(connection.id)
                }
              >
                {t('Delete Connection')}
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
        <StyledInput
          value={newConnection?.payload || ''}
          onChange={(e) =>
            setNewConnection({ ...newConnection, payload: e.target.value })
          }
          placeholder={t('Payload') || ''}
        />
        <StyledButton type="submit">{t('Add Connection')}</StyledButton>
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
