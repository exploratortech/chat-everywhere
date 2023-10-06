import appInsights from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

export const telemetryEnabled = ['production', 'staging'].includes(
  process.env.NEXT_PUBLIC_ENV!,
);

appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);

if (telemetryEnabled) {
  appInsights.start();
}

export const telemetryClient = telemetryEnabled
  ? appInsights.defaultClient
  : null;

export const trackError = (
  error: string,
  severity: SeverityLevel = SeverityLevel.Error,
) => {
  if (!telemetryClient) return;
  telemetryClient.trackException({ exception: new Error(error), severity });
};
