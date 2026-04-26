# Payment and Billing System Documentation

## Overview
The Ihub Academy Hub uses a robust payment and billing system designed to handle both local (Rwandan) and international transactions. The system is integrated with **Paypack** for Mobile Money transactions and **Stripe** for card-based payments.

---

## 🏗️ System Architecture

The payment system follows a decoupled architecture where the frontend initiates requests, and the backend handles communication with third-party gateways, status tracking, and fulfillment (e.g., enrolling students).

### Key Components:
1.  **Frontend**: Provides the user interface for initiating payments (Enrollment Dialogs) and viewing billing history (`StudentPayments.tsx`).
2.  **API Backend**: Exposes endpoints for initiating payments, checking status, and receiving webhooks.
3.  **Payment Gateways**:
    *   **Paypack**: Primary gateway for MTN MoMo and Airtel Money in Rwanda.
    *   **Stripe**: Used for Internship program fees and international card payments.

---

## 🛠️ Service Integrations

### 1. Paypack (Mobile Money)
Managed via [`paypack.service.ts`](file:///Users/andela/projects/ihub-academy-hub/backend/src/services/paypack.service.ts).

*   **Authentication**: Uses Client ID and Secret to obtain a Bearer Token. Tokens are cached and refreshed automatically.
*   **Operations**:
    *   `initiatePayment`: Triggers a CASHIN (push) request to the user's mobile phone.
    *   `getTransactionStatus`: Polls Paypack API for the latest status of a reference.
    *   `verifyWebhookSignature`: Ensures inbound webhooks are authentic using HMAC SHA256.

### 2. Stripe (Card Payments)
Managed via [`stripe.service.ts`](file:///Users/andela/projects/ihub-academy-hub/backend/src/services/stripe.service.ts).

*   **Operations**:
    *   `createPaymentIntent`: Generates a client secret for secure frontend payment processing.
    *   `createCheckoutSession`: Redirects users to a Stripe-hosted checkout page.
    *   `refundPayment`: Handles partial or full refunds.

---

## 📊 Data Models

### 1. `PaymentTransaction`
Stores the technical details of every transaction attempt.
*   `paypackRef`: Unique reference from the gateway.
*   `type`: `CASHIN` or `CASHOUT`.
*   `status`: `pending`, `successful`, `failed`.
*   `metadata`: Stores extra info like webhook timestamps.

### 2. `Payment` (Billing History)
Used for the user-facing "Bills" and accounting.
*   `userId`: Reference to the student.
*   `type`: e.g., 'Course Enrollment', 'Internship Fee'.
*   `itemTitle`: Description of what was purchased.
*   `proofOfPaymentUrl`: (Optional) For manual payment verification.

---

## 🔄 Payment Lifecycle (Happy Path)

1.  **Initiation**: User clicks "Enroll" and enters their phone number.
2.  **Creation**: Backend calls Paypack API and creates a `pending` `PaymentTransaction`.
3.  **Verification**: 
    *   The user receives a USSD prompt on their phone and enters their PIN.
    *   Paypack sends a **Webhook** to our `/api/payments/webhook` endpoint.
4.  **Fulfillment**: Upon receiving a `successful` status:
    *   The transaction is marked `successful`.
    *   The user is automatically enrolled in the course (`User.enrolledCourses`).
    *   The course's student list is updated (`Course.studentsEnrolled`).
    *   (If Internship) The internship record status is changed to `enrolled`.

---

## 🖥️ Frontend Interfaces

### Student Billing
*   **Path**: `/portal/student/payments`
*   **Feature**: Lists all transactions, displays status badges, and allows downloading receipts for completed payments.
*   **Manual Proof**: Allows users to upload a screenshot of their SMS/Receipt if automatic processing fails.

### Admin Management
*   **Path**: `/portal/admin/payments`
*   **Feature**: Allows administrators to monitor all system-wide transactions, manually approve pending payments, and view analytics.

---

## ⚙️ Environment Configuration

The following variables must be configured in `.env`:

```env
# Paypack Configuration
PAYPACK_CLIENT_ID=your_client_id
PAYPACK_CLIENT_SECRET=your_client_secret
PAYPACK_WEBHOOK_SECRET=your_webhook_secret
PAYPACK_BASE_URL=https://paypack.rw/api/v1
PAYPACK_ENVIRONMENT=production # or development

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

> [!IMPORTANT]
> Always ensure the Webhook endpoint is public and the signature verification is active in production to prevent fraudulent "successful" signals.
