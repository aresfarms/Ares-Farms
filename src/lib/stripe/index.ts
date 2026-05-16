export const stripe = {
  checkout: {
    sessions: {
      create: async (params: any) => {
        // 🧠 stub behaves like real Stripe API
        return {
          id: "stub_session_id",
          url: "http://localhost:3000/dashboard",
          amount: params?.amount_total || 0,
          currency: params?.currency || "usd",
          mode: params?.mode || "payment",
        };
      },
    },
  },
};
