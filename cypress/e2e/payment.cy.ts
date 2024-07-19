import { TEST_PAYMENT_USER } from './account';

import dayjs from 'dayjs';

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

  // Reset payment by calling API
  afterEach(() => {
    cy.request({
      method: 'POST',
      url: '/api/cypress/reset-test-payment-user-subscription',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  // Logout
  after(() => {
    cy.reload();
    cy.get('[data-cy="settings-button"]').click();
    cy.get('[data-cy="chatbar-settings-modal"]')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-cy="sign-out-confirmation-button"]').click();
    cy.get('[data-cy="sign-out-and-clear-button"]').click();
    cy.contains('You have been logged out');
  });
  it('upgrade to pro plan', () => {
    // Make sure the user is on Free plan.
    cy.get('[data-cy="user-account-badge"]', { timeout: 10000 }).then(($el) => {
      expect($el).to.have.text('Free');
    });

    // calls the `/api/cypress/test-subscription-plan-payment` endpoint to test the payment flow.
    cy.request({
      method: 'POST',
      url: '/api/cypress/test-subscription-plan-payment',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        plan: 'pro',
      },
    });

    // Refreshes the page and checks if the user is on Pro plan.
    cy.reload();
    cy.get('[data-cy="user-account-badge"]', { timeout: 10000 }).then(($el) => {
      expect($el).to.have.text('Pro');
    });

    cy.get('[data-cy="settings-button"]').click();
    cy.get('[data-cy="chatbar-settings-modal"]')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-cy="chatbar-settings-modal"]').within(() => {
      const newExpirationDate = dayjs().add(1, 'month').format('MMM DD, YYYY');
      cy.contains(`Expires on: ${newExpirationDate}`);
    });
  });

  it('upgrade to ultra plan', () => {
    // Make sure the user is on Free plan.
    cy.get('[data-cy="user-account-badge"]', { timeout: 10000 }).then(($el) => {
      expect($el).to.have.text('Free');
    });

    // calls the `/api/cypress/test-subscription-plan-payment` endpoint to test the payment flow.
    cy.request({
      method: 'POST',
      url: '/api/cypress/test-subscription-plan-payment',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        plan: 'ultra',
      },
    });

    // Refreshes the page and checks if the user is on Ultra plan.
    cy.reload();
    cy.get('[data-cy="user-account-badge"]', { timeout: 10000 }).then(($el) => {
      expect($el).to.have.text('Ultra');
    });

    cy.get('[data-cy="settings-button"]').click();
    cy.get('[data-cy="chatbar-settings-modal"]')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-cy="chatbar-settings-modal"]').within(() => {
      const newExpirationDate = dayjs().add(1, 'month').format('MMM DD, YYYY');
      cy.contains(`Expires on: ${newExpirationDate}`);
    });
  });

  it('Make sure custom remove subscription event is working', () => {
    // Make the user to Pro plan by calling the /api/cypress/test-subscription-plan-payment endpoint
    cy.request({
      method: 'POST',
      url: '/api/cypress/test-subscription-plan-payment',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        plan: 'pro',
      },
    });

    // Make sure the user is on Pro plan
    cy.reload();
    cy.get('[data-cy="user-account-badge"]', { timeout: 10000 }).then(($el) => {
      expect($el).to.have.text('Pro');
    });

    // Call the /api/cypress/test-cancel-subscription endpoint
    cy.request({
      method: 'POST',
      url: '/api/cypress/test-cancel-subscription',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    cy.reload();
    // Make sure the user is on Pro plan but with a extra day from the expiration date
    cy.get('[data-cy="user-account-badge"]', { timeout: 10000 }).then(($el) => {
      expect($el).to.have.text('Pro');
    });
    cy.get('[data-cy="settings-button"]').click();
    cy.get('[data-cy="chatbar-settings-modal"]')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-cy="chatbar-settings-modal"]').within(() => {
      const newExpirationDate = dayjs()
        .add(1, 'month')
        .add(1, 'day')
        .format('MMM DD, YYYY');
      cy.contains(`Expires on: ${newExpirationDate}`);
    });
  });
});
