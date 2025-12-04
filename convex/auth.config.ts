export default {
  providers: [
    {
      domain: "https://elegant-grouper-65.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
  // JWT template for Clerk authentication
  jwtTemplates: {
    clerk: {
      claimNamespace: "https://clerk.dev/",
      claims: [
        "sub",
        "email",
        "email_verified",
        "phone_number",
        "phone_verified",
        "full_name",
        "first_name",
        "last_name",
        "primary_email_address_id",
        "primary_phone_number_id",
        "role",
        "permissions",
      ],
    },
  },
};
