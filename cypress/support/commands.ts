/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  const hostUrl = Cypress.env('HOST_URL') || 'http://localhost:3000';
  cy.visit(hostUrl);
  // login
  cy.get('[data-cy="sign-in-button"]').click();
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('#auth-sign-in > :nth-child(1) > .supabase-auth-ui_ui-button').click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

export {};
