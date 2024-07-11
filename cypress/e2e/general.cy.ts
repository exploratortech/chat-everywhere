import { PRO_USER } from "./account";

describe('Free user usage', () => {
  const hostUrl = Cypress.env('HOST_URL') || 'http://localhost:3000';

  it('is able to send messages', () => {
    cy.log('hostUrl: ', hostUrl);

    cy.visit(hostUrl);
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

  beforeEach(() => {
    cy.session(
      'user',
      () => {
        cy.login(PRO_USER.email, PRO_USER.password);
      },
      {
        validate: () => {
          cy.get('[data-cy="user-account-badge"]', { timeout: 10000 }).should(
            'be.visible',
          );
        },
      },
    );
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
    cy.visit(hostUrl);
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
