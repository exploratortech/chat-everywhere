import { PRO_USER } from "./account";

describe('Image generation', () => {
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
  it('is able to create an image via AI Image Mode (MJ)', () => {
    cy.visit(hostUrl);
    cy.get('[data-cy="chat-input"]', { timeout: 20000 }).should('be.visible');
    cy.get('[data-cy="chat-input"]').click();
    cy.get('[data-cy="chat-input"]').realType('A fireman is rescuing a cat from a tree.');
    cy.get('[data-cy="chat-enhanced-menu"]').scrollIntoView().should('be.visible');
    cy.get('[data-cy="chat-mode-selector"]').select('AI Image');
    cy.pause();

    cy.get('[data-cy="chat-send-button"]').click();
    cy.get('[data-cy="assistant-respond-message"]').within(() => {
      cy.get('div#mj-image-static-v2', { timeout: 120000 }).should('exist');
      cy.get('div#mj-image-static-v2').within(() => {
        // Check if the download button is visible
        cy.get('button[data-cy="mj-image-v2-download-button"]').should('exist');

        // Check if the first message contain buttons like "U1", "U2", "V1", "V2"
        cy.get('div[data-cy="mj-image-v2-button-container"]').should('exist');
        cy.get('div[data-cy="mj-image-v2-button-container"]').within(() => {
          cy.contains('button', 'U1').should('exist');
          cy.contains('button', 'U2').should('exist');
          cy.contains('button', 'V1').should('exist');
          cy.contains('button', 'V2').should('exist');
        });
      });
    });
    //
    // Check if the Remaining Credits are displayed
    cy.get('div[data-cy="credit-counter"]').should('exist');

  });
});

export { };
