import Stripe from 'stripe';

export default async function getCustomerEmailByCustomerID(
  customerID: string,
): Promise<string> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2022-11-15',
    });

    // We get the customer id from webhook, so we know the customer is not deleted
    const customer = (await stripe.customers.retrieve(
      customerID,
    )) as Stripe.Customer;
    if (!customer.email) {
      throw new Error(
        `the customer does not have an email, customer id is ${customerID}`,
      );
    }
    return customer.email;
  } catch (e) {
    throw new Error(`getCustomerEmailByCustomerID failed: ${e}`);
  }
}
