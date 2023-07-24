import { SeverityLevel } from '@microsoft/applicationinsights-web';
import { appInsights } from './azureAppInsights';

export function trackError(errorMessage: string, severity: SeverityLevel = SeverityLevel.Error) {
  const error = new Error(errorMessage);
  appInsights?.trackException({ exception: error, severityLevel: severity });
}