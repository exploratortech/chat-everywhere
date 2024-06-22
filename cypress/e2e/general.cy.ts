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

export {};
