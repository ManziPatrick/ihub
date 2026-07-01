# TODO
- [ ] Fix Paypack/PawaPay duplicate key error where paypackRef can be null
  - [x] Confirm failing index/schema usage (PaymentTransaction.paypackRef)
  - [ ] Update Paypack service to always generate a unique non-null depositId (if depositId missing)
  - [ ] Update PaymentController to store paypackRef only when depositId is present; otherwise generate one locally
  - [ ] Update MongoDB index: ensure unique constraint does not include null values (partial unique index on paypackRef exists)
  - [ ] Add guard logs for missing depositId from provider
- [ ] Add a small test script to simulate duplicate/null depositId and verify inserts succeed

