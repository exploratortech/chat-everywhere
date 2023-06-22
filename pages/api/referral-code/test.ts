import voucher_codes from 'voucher-code-generator';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const codes = voucher_codes.generate({
      length: 8,
      count: 4,
    });

    // const userId = '3a38762c-4562-424e-86db-c66544c8e342';
    // generateReferralCode(userId);
    return new Response(JSON.stringify({ codes }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
