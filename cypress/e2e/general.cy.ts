// NOTE: Please make sure all of users are existed in the Production database
// The tests in this file will also be run in Production environment daily as a health check

import { PRIORITY_USER, PRO_USER } from "./account";

describe('Free user usage', () => {
  const hostUrl = Cypress.env('HOST_URL') || 'http://localhost:3000';

  beforeEach(() => {
    cy.visit(hostUrl);
  });

  it('is able to send messages', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 20000 }).should('be.visible');
    cy.get('[data-cy="chat-input"]').type('Reply "Hello World" to me.');
    cy.get('[data-cy="chat-send-button"]').click();
    cy.get('[data-cy="assistant-respond-message"]', { timeout: 20000 }).should(
      'contain.text',
      'Hello World',
    );
  });
});

// Pro user usage
describe('Pro user usage', () => {
  const hostUrl = Cypress.env('HOST_URL') || 'http://localhost:3000';
  const isRunningOnProduction = hostUrl === 'https://chateverywhere.app';

  beforeEach(() => {
    const password = isRunningOnProduction ? Cypress.env('PRO_ACCOUNT_PASSOWORD_PRODUCTION') : PRO_USER.password;

    cy.session(
      'pro-user',
      () => {
        cy.login(PRO_USER.email, password);
      },
      {
        validate: () => {
          cy.get('[data-cy="user-account-badge"]', { timeout: 10000 }).should(
            'be.visible',
          );
        },
      },
    );

    cy.visit(hostUrl);
  });

  after(() => {
    cy.get('[data-cy="settings-button"]').click();
    cy.get('[data-cy="chatbar-settings-modal"]')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-cy="sign-out-confirmation-button"]').click();
    cy.get('[data-cy="sign-out-and-clear-button"]').click();
    cy.contains('You have been logged out');
  });
  it('is able to send messages', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 20000 }).should('be.visible');
    cy.get('[data-cy="chat-input"]').type('Reply "Hello World" to me.');
    cy.get('[data-cy="chat-send-button"]').click();
    cy.get('[data-cy="assistant-respond-message"]', { timeout: 20000 }).should(
      'contain.text',
      'Hello World',
    );
  });
});

// Priority user usage
describe('Priority user usage', () => {
  const hostUrl = Cypress.env('HOST_URL') || 'http://localhost:3000';
  const isRunningOnProduction = hostUrl === 'https://chateverywhere.app';

  beforeEach(() => {
    // NOTE: The priority user uses the same password as the Pro user in Production
    const password = isRunningOnProduction ? Cypress.env('PRO_ACCOUNT_PASSOWORD_PRODUCTION') : PRIORITY_USER.password;

    cy.session(
      'priority-user',
      () => {
        cy.login(PRIORITY_USER.email, password);
      },
      {
        validate: () => {
          cy.get('[data-cy="user-account-badge"]', { timeout: 10000 }).should(
            'be.visible',
          );
        },
      },
    );

    cy.visit(hostUrl);
  });

  after(() => {
    cy.get('[data-cy="settings-button"]').click();
    cy.get('[data-cy="chatbar-settings-modal"]')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-cy="sign-out-confirmation-button"]').click();
    cy.get('[data-cy="sign-out-and-clear-button"]').click();
    cy.contains('You have been logged out');
  });
  it.only('is able to send messages', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 20000 }).should('be.visible');
    cy.get('[data-cy="chat-input"]').type('Reply "Hello World" to me.');
    cy.get('[data-cy="chat-send-button"]').click();
    cy.get('[data-cy="assistant-respond-message"]', { timeout: 20000 }).should(
      'contain.text',
      'Hello World',
    );
  });
});

export { };
