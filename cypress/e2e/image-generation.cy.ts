import { PRO_USER } from './account';

describe('Image generation', () => {
  const hostUrl = Cypress.env('HOST_URL') || 'http://localhost:3000';
  const isRunningOnProduction = hostUrl === 'https://chateverywhere.app';

  beforeEach(() => {
    cy.session(
      'user',
      () => {
        const password = isRunningOnProduction
          ? Cypress.env('PRO_ACCOUNT_PASSOWORD_PRODUCTION')
          : PRO_USER.password;
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
  it('is able to create an image via AI Image Mode (MJ)', () => {
    cy.get('[data-cy="chat-enhanced-menu-container"]', { timeout: 5000 }).then(
      () => {
        // This is to ensure the menu is rendered
        cy.get('[data-cy="chat-enhanced-menu-container"]').should(
          'have.css',
          'display',
          'none',
        );
      },
    );

    cy.get('[data-cy="chat-input"]', { timeout: 2000 }).then(() => {
      // Ensure the enhanced menu is displayed
      cy.get('[data-cy="chat-input"]').realTouch();
      cy.get('[data-cy="chat-input"]').realMouseDown();
    });

    cy.get('[data-cy="chat-enhanced-menu-container"]').should(
      'have.css',
      'display',
      'flex',
    );
    cy.get('[data-cy="chat-input"]').realClick();
    cy.get('[data-cy="chat-input"]').type(
      'A fireman is rescuing a cat from a tree.',
    );
    cy.get('[data-cy="chat-enhanced-menu"]')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-cy="chat-mode-selector"]').select('AI Image');

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

export {};
