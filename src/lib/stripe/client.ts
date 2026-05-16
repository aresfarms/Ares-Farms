export const stripe = {
  checkout: {
    sessions: {
      create: async (params: any) => {
        return {
          id: "stub_checkout_session",
          url: "http://localhost:3000/dashboard",

          mode: params?.mode ?? "payment",
          payment_method_types:
            params?.payment_method_types ?? ["card"],

          customer_email: params?.customer_email ?? null,

          metadata: params?.metadata ?? {},

          success_url:
            params?.success_url ??
            "http://localhost:3000/success",

          cancel_url:
            params?.cancel_url ??
            "http://localhost:3000/dashboard",
        };
      },
    },
  },
};
