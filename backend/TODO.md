TODO

- [x] Fix GraphQL non-null crash for CommissionDisbursement.customerId by routing to non-null-safe resolvers.
  - Files: backend/src/graphql/disbursement-resolvers.fixed.ts
  - Wiring: backend/src/graphql/resolvers.ts

- [ ] Ensure disbursement commission calculation follows platform commission configuration by default.
  - Likely updates: backend/src/services/disbursement.service.ts
  - Expected behavior: Platform Commission Configuration (Config keys) overrides default commission logic unless admin-specific commission is explicitly configured.

- [ ] Re-run TypeScript compile and relevant disbursement tests.

