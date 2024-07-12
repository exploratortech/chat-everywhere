
import { TEST_PAYMENT_USER } from "./account";

describe('Test Payment Flow', () => {
  const hostUrl = Cypress.env('HOST_URL') || 'http://localhost:3000';


  beforeEach(() => {
    cy.session(
      'user',
      () => {
        cy.login(TEST_PAYMENT_USER.email, TEST_PAYMENT_USER.password);
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

  // Reset payment by calling the /api/cypress/reset-user-subscription endpoint
  after(() => {
    // TODO: add the reset user subscription endpoint
    // TODO: call the reset user subscription endpoint
  });

  // Logout 
  after(() => {
    cy.get('[data-cy="settings-button"]').click();
    cy.get('[data-cy="chatbar-settings-modal"]')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-cy="sign-out-confirmation-button"]').click();
    cy.get('[data-cy="sign-out-and-clear-button"]').click();
    cy.contains('You have been logged out');
  });
  it('upgrade to pro plan', () => {
    // TODO: 1. Make sure the user is on Free plan.
    // TODO: 2. Cypress calls the `/api/cypress/test-payment-event` endpoint to start the test.
    // TODO: 3. The webhook will update the user's subscription plan to `pro-monthly`.
    // TODO: 4. Cypress refreshes the page and checks if the user is on Pro plan.
  });

  // TODO: add test for Ultra plan
});

