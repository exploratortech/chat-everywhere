import { PRIORITY_USER, PRO_USER } from './account';

describe('Pro User using Image generation', () => {
  const hostUrl = Cypress.env('HOST_URL') || 'http://localhost:3000';
  const isRunningOnProduction = hostUrl === 'https://chateverywhere.app';

  beforeEach(() => {
    cy.session(
      'pro user',
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
    mjImageGenerationModeTest();
    // Check if the Remaining Credits are displayed
    cy.get('div[data-cy="credit-counter"]').should('exist');
  });

  it('is able to create an image via AI Painter Mode', () => {
    aiPainterModeTest();
    // Check if the Remaining Credits are displayed
    cy.get('div[data-cy="credit-counter"]').should('exist');
  });
});

describe('Priority User using Image generation', () => {
  const hostUrl = Cypress.env('HOST_URL') || 'http://localhost:3000';
  const isRunningOnProduction = hostUrl === 'https://chateverywhere.app';

  beforeEach(() => {
    cy.session(
      'priority user',
      () => {
        const password = isRunningOnProduction
          ? Cypress.env('PRO_ACCOUNT_PASSOWORD_PRODUCTION')
          : PRIORITY_USER.password;
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
  it('is able to create an image via AI Image Mode (MJ)', () => {
    mjImageGenerationModeTest();
    // Ultra user do not need to check the remaining credits
    cy.get('div[data-cy="credit-counter"]').should('not.exist');
  });

  it('is able to create an image via AI Painter Mode', () => {
    aiPainterModeTest();
    // Ultra user do not need to check the remaining credits
    cy.get('div[data-cy="credit-counter"]').should('not.exist');
  });
});

export {};

function mjImageGenerationModeTest() {
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
}
function aiPainterModeTest() {
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
  cy.get('[data-cy="chat-mode-selector"]').select('AI Painter');

  cy.get('[data-cy="chat-send-button"]').click();

  cy.get('[data-cy="assistant-respond-message"]').within(() => {
    cy.get('[data-cy="ai-painter-result-container"]', {
      timeout: 120000,
    }).should('exist');
    cy.get('[data-cy="ai-painter-result-image-1"]').should('exist');
    cy.get('[data-cy="ai-painter-result-image-1"]').realHover();

    cy.get('[data-cy="ai-painter-result-download-button-1"]').should(
      'be.visible',
    );
    cy.get('[data-cy="ai-painter-result-image-2"]').should('exist');
    cy.get('[data-cy="ai-painter-result-image-2"]').realHover();
    cy.get('[data-cy="ai-painter-result-download-button-2"]').should(
      'be.visible',
    );
  });
}
