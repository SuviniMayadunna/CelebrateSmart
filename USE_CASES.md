# CelebrateSmart — Use Cases

**System:** CelebrateSmart Event Planning & Booking Platform  
**Actors:**
- **Customer** — Registered end user who creates events and books packages
- **Admin** — Staff member who manages orders, customers, and operations
- **Stripe** — External payment gateway (processes charges and refunds)
- **Email System** — External email service (sends transactional emails via AWS SES)

---

## UC-01: Register Account

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | A new user creates a CelebrateSmart account to access the platform. |
| **Preconditions** | User is not logged in. User has a valid email address. |

**Main Flow:**
1. User navigates to the Registration screen.
2. User enters name, email, phone number, and password.
3. System validates all fields (email format, password length, phone format).
4. System checks that the email is not already registered.
5. System hashes the password and creates a new Customer account.
6. System issues a JWT authentication token.
7. System logs the user in and redirects to the Dashboard.

**Alternative Flows:**
- *3a.* Validation fails → System displays inline error messages; user corrects and resubmits.
- *4a.* Email already exists → System shows "An account with this email already exists."

**Postconditions:** A new Customer account exists. User is authenticated and on the Dashboard.

---

## UC-02: Login

| Field | Detail |
|-------|--------|
| **Actor** | Customer / Admin |
| **Description** | An existing user authenticates to access the platform. |
| **Preconditions** | User has a registered account. |

**Main Flow:**
1. User navigates to the Login screen.
2. User enters email and password and selects role (Customer or Admin).
3. System validates credentials against the database.
4. System issues a JWT token and stores it in the browser.
5. System redirects the user to the Dashboard (Customer) or Admin Dashboard (Admin).

**Alternative Flows:**
- *3a.* Incorrect email or password → System displays "Invalid email or password."
- *3b.* Role mismatch (e.g., customer tries admin login) → System shows "Access denied."

**Postconditions:** User is authenticated. JWT token is stored for subsequent API calls.

---

## UC-03: Logout

| Field | Detail |
|-------|--------|
| **Actor** | Customer / Admin |
| **Description** | Authenticated user ends their session. |
| **Preconditions** | User is logged in. |

**Main Flow:**
1. User clicks "Sign Out" in the navigation sidebar.
2. System clears the JWT token from the browser.
3. System clears the local event and cart state.
4. System redirects to the Welcome screen.

**Postconditions:** Session is terminated. User must log in again to access protected features.

---

## UC-04: Create Event

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | Customer creates a new event to begin the planning process. |
| **Preconditions** | Customer is logged in. |

**Main Flow:**
1. Customer clicks "+ New Event" or "Plan Event" in the navigation.
2. System displays the Event Templates screen with event types (Birthday, Wedding, Proposal, Baby Shower, Kids Party).
3. Customer selects an event type.
4. System navigates to the Event Creation screen with the selected type pre-filled.
5. Customer enters event name, date, start time, venue (optional), and notes (optional).
6. Customer submits the form.
7. System validates required fields (name, date, time).
8. System creates the event record linked to the Customer's account.
9. System seeds default planning tasks (Cake, Decorations, Food, Entertainment, Photography, Venue).
10. System navigates Customer to the Event Planning screen.

**Alternative Flows:**
- *7a.* Required fields missing → System displays validation error; user corrects and resubmits.

**Postconditions:** A new Event record exists. Customer is on the Event Planning screen.

---

## UC-05: Browse and Select a Package

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | Customer browses available event packages and selects one to book. |
| **Preconditions** | Customer is logged in. An event has been created. |

**Main Flow:**
1. Customer navigates to "Plan Event" and selects an event type.
2. System displays the Package Picker screen showing Bronze, Silver, and Gold tier packages for the selected event type.
3. System displays each package's included services (Food, Cake, Decorations, Photography, Entertainment, etc.) and base price.
4. Customer selects a package tier.
5. System navigates to the Package Customizer screen with the selected package pre-loaded.

**Alternative Flows:**
- *2a.* No packages available for the event type → System shows an empty state with guidance.

**Postconditions:** Customer is on the Package Customizer screen with a package selected.

---

## UC-06: Customise Package and Add to Cart

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | Customer customises the selected package (guest count, colour theme, venue, date) and adds it to cart. |
| **Preconditions** | Customer has selected a package (UC-05). |

**Main Flow:**
1. System displays the Package Customizer with event details pre-filled.
2. Customer adjusts guest count using the +/− control.
3. System recalculates the total price in real-time based on guest count (food items scale per guest).
4. Customer optionally selects a colour theme from the swatches.
5. Customer optionally enters a venue and special notes.
6. Customer clicks "Add to Cart".
7. System creates an Event record (if none exists) with the provided details.
8. System adds the package items to the cart linked to the event.
9. System navigates Customer to the Cart screen.

**Alternative Flows:**
- *2a.* Guest count is below 1 → System prevents submission and shows a validation error.

**Postconditions:** Cart contains the package items. Event record is linked to the cart.

---

## UC-07: Checkout and Pay for Package

| Field | Detail |
|-------|--------|
| **Actor** | Customer, Stripe |
| **Description** | Customer pays for the cart (event package) via Stripe. |
| **Preconditions** | Cart contains at least one item. Customer is logged in. |

**Main Flow:**
1. Customer navigates to the Cart and clicks "Proceed to Checkout".
2. System creates a Stripe PaymentIntent for the total cart amount.
3. System displays the Checkout screen with the Stripe payment form (card details).
4. Customer enters card details and clicks "Pay Now".
5. Stripe processes the payment and returns a success status.
6. System calls the confirm-payment endpoint with the PaymentIntent ID.
7. System verifies the PaymentIntent is in `succeeded` state via the Stripe API.
8. System creates an Order record (status: PAID) linked to the event and customer.
9. System records `originalGuestCount` on the Order for future repricing.
10. System clears the cart items.
11. System generates a personalised EventPlan with checklist steps and vendor milestones.
12. Email System sends an order confirmation email to the customer.
13. Email System sends a new order notification email to the admin.
14. System navigates Customer to the Event Plan screen.

**Alternative Flows:**
- *5a.* Payment declined by Stripe → System displays "Payment failed. Please try again or use a different card."
- *7a.* PaymentIntent not in `succeeded` state → System returns 400 error; order is not created.

**Postconditions:** Order is created (PAID status). EventPlan with steps is generated. Confirmation emails are sent.

---

## UC-08: View Event Plan

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | Customer views their personalised event plan after booking, including checklist and vendor timeline. |
| **Preconditions** | Customer has a paid event booking. |

**Main Flow:**
1. Customer navigates to "My Events" and clicks on a paid event card.
2. System loads the Event Plan screen showing event details (name, date, time, venue, guest count, countdown).
3. System displays the booked package details (tier, colour theme, included services).
4. System displays two sections:
   - **Your Checklist** — customer action items grouped by weeks before the event.
   - **What We're Handling** — vendor milestones managed by CelebrateSmart.
5. Customer reviews their tasks and vendor confirmations.

**Alternative Flows:**
- *2a.* Plan fetch fails → System shows a loading error toast; plan section shows empty state.

**Postconditions:** Customer has visibility into all planning steps and vendor actions.

---

## UC-09: Mark Checklist Step as Complete

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | Customer ticks off a completed checklist step in their event plan. |
| **Preconditions** | Customer is on the Event Plan screen (UC-08). |

**Main Flow:**
1. Customer clicks the circle icon next to an incomplete step.
2. System optimistically marks the step as completed in the UI (strikethrough text, filled icon).
3. System sends a PATCH request to mark the step complete in the database.
4. System updates the progress bar and step counters.

**Alternative Flows:**
- *3a.* API call fails → System reverts the step to incomplete and shows a "Failed to update step" toast.
- *1a.* Step is already completed → Customer clicks to unmark; System sends uncomplete request and reverts the step.

**Postconditions:** Step is marked complete/incomplete in the database. Progress counters are updated.

---

## UC-10: Edit Event Details

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | Customer updates event details (name, date, time, venue, notes) after booking. |
| **Preconditions** | Customer has a paid event. Event is not cancelled. |

**Main Flow:**
1. Customer clicks "Edit Event" on the Event Plan screen.
2. System displays the Edit Event modal with current values pre-filled.
3. Customer modifies any combination of name, date, time, venue, or notes.
4. Customer clicks "Save Changes".
5. System validates required fields (name, date, time).
6. System sends a PATCH request to update the event.
7. System updates the Event Plan screen with the new details and shows a success toast.

**Alternative Flows:**
- *5a.* Required fields are empty → System shows a validation error toast; modal stays open.
- *6a.* API call fails → System shows an error toast; changes are not saved.

**Postconditions:** Event record is updated with new details.

---

## UC-11: Adjust Guest Count on Paid Event

| Field | Detail |
|-------|--------|
| **Actor** | Customer, Stripe |
| **Description** | Customer changes the guest count on a paid booking, triggering a prorated charge or refund. |
| **Preconditions** | Customer has a paid event. Event is not cancelled. |

**Main Flow:**
1. Customer opens the Edit Event modal (UC-10).
2. Customer types a new guest count in the Guest Count field.
3. System displays a real-time price preview showing:
   - Original total (with original guest count)
   - Adjustment amount (+ for increase, − for decrease)
   - New total
4. Customer clicks "Save Changes".
5. System calls the adjust-guests endpoint with the new guest count.
6. **If guest count decreased:**
   - System calculates refund = (original − new) × per-guest rate.
   - Stripe issues a partial refund to the original payment method.
   - System updates the Order total and Event guest count.
   - System shows a "Refund initiated" toast.
7. **If guest count increased:**
   - System creates a new Stripe PaymentIntent for the additional amount.
   - System shows a Stripe payment form inside the modal.
   - Customer enters card details and confirms the additional payment.
   - System verifies payment and updates the Order total and Event guest count.

**Alternative Flows:**
- *5a.* Guest count unchanged → No adjustment is made.
- *6a.* Stripe refund fails → System returns 500; user is shown an error toast.
- *7a.* Additional payment declined → System shows "Payment failed"; guest count is not updated.

**Postconditions:** Guest count is updated. Order total reflects the adjustment. Refund or additional charge is applied via Stripe.

---

## UC-12: Cancel Booking

| Field | Detail |
|-------|--------|
| **Actor** | Customer, Stripe, Email System |
| **Description** | Customer cancels a paid event booking, receiving a 90% refund (10% cancellation fee applies). |
| **Preconditions** | Customer has a paid event. Event date is more than 24 hours away. Event is not already cancelled. |

**Main Flow:**
1. Customer clicks "Cancel Booking" on the Event Plan screen.
2. System displays the Cancel Booking modal showing:
   - Event name
   - 10% cancellation fee warning
   - Explanation that 90% will be refunded within 3–5 business days
3. Customer clicks "Confirm Cancellation".
4. System validates:
   - Order belongs to this customer and is in PAID status.
   - Event date is more than 24 hours from now.
5. System calculates: cancellation fee = 10% of order total; refund = 90%.
6. Stripe processes a partial refund of 90% to the original payment method.
7. System updates the Order (status: CANCELED, paymentStatus: REFUNDED, cancellationFee, refundAmount).
8. System updates the Event status to CANCELED.
9. Email System sends a cancellation confirmation email with the refund breakdown.
10. System shows a success state in the modal with the refund amount.
11. System redirects Customer to My Events.

**Alternative Flows:**
- *4a.* Event is within 24 hours → "Cancel Booking" button is disabled with tooltip "Cannot cancel within 24 hours of your event."
- *4b.* Order is not in PAID status (already cancelled or wrong user) → System returns 404.
- *6a.* Stripe refund fails → System returns 500; cancellation is not processed; user shown an error.

**Postconditions:** Order is CANCELED/REFUNDED. Event is CANCELED. 90% refund is initiated. Cancellation email is sent. Event card shows ✕ Cancelled badge in My Events.

---

## UC-13: Browse Shop and Add Products to Cart

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | Customer browses individual products and adds them to the cart for a standalone purchase. |
| **Preconditions** | Customer is logged in. |

**Main Flow:**
1. Customer navigates to "Shop" in the sidebar.
2. System displays products grouped by category (Cakes, Decorations, Food, Photography, Entertainment, etc.).
3. Customer optionally filters by category.
4. Customer clicks "Add to Cart" on a product.
5. System adds the product to the customer's cart (quantity: 1, or increments if already in cart).
6. System updates the cart item count badge in the sidebar.

**Alternative Flows:**
- *4a.* Product is out of stock → "Add to Cart" is disabled.

**Postconditions:** Product is in the cart. Cart count badge is updated.

---

## UC-14: View Orders

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | Customer views their order history including package bookings and individual product orders. |
| **Preconditions** | Customer is logged in. |

**Main Flow:**
1. Customer navigates to "Orders" in the sidebar.
2. System fetches the customer's order history.
3. System displays orders in two groups:
   - **Package Bookings** — event-linked orders showing event name, date, tier, amount paid, and status.
   - **Product Orders** — shop purchases showing items, total, and delivery status.
4. Customer expands an order to see full details (line items, payment status, refund info if cancelled).

**Alternative Flows:**
- *2a.* No orders exist → System shows an empty state message.

**Postconditions:** Customer has full visibility of all their orders and statuses.

---

## UC-15: View Notifications

| Field | Detail |
|-------|--------|
| **Actor** | Customer |
| **Description** | Customer views system notifications about upcoming event milestones. |
| **Preconditions** | Customer is logged in and has a paid event with upcoming steps. |

**Main Flow:**
1. Customer clicks the notification bell in the sidebar (shows unread count badge).
2. System displays a list of notifications (e.g., "Your event is in 7 days — confirm your venue booking").
3. Customer reads and dismisses notifications.
4. System marks notifications as read and removes the badge count.

**Postconditions:** Notifications are marked as read.

---

## UC-16: Admin — View Dashboard

| Field | Detail |
|-------|--------|
| **Actor** | Admin |
| **Description** | Admin views a summary of platform statistics. |
| **Preconditions** | Admin is logged in. |

**Main Flow:**
1. Admin navigates to the Admin Dashboard.
2. System displays statistics:
   - Total registered customers
   - Total orders placed
   - Total revenue (sum of all paid order amounts)
   - Pending orders (awaiting preparation or delivery)
3. Admin can switch between tabs: Overview, Orders, Customers.

**Postconditions:** Admin has an up-to-date view of platform performance.

---

## UC-17: Admin — Manage Orders

| Field | Detail |
|-------|--------|
| **Actor** | Admin |
| **Description** | Admin views all customer orders and updates their fulfilment status. |
| **Preconditions** | Admin is logged in. |

**Main Flow:**
1. Admin navigates to the Orders tab in the Admin Dashboard.
2. System displays all orders with columns: order number, customer, event details, total amount, status, payment status.
3. Admin clicks on an order to view full details.
4. Admin updates the order status (e.g., PAID → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED).
5. System saves the updated status and reflects it in the customer's Order History.

**Alternative Flows:**
- *4a.* Order is CANCELED → Status cannot be updated further.

**Postconditions:** Order status is updated. Customer sees the updated status in their Orders screen.

---

## UC-18: Admin — View Customers

| Field | Detail |
|-------|--------|
| **Actor** | Admin |
| **Description** | Admin views the list of registered customers and their account details. |
| **Preconditions** | Admin is logged in. |

**Main Flow:**
1. Admin navigates to the Customers tab in the Admin Dashboard.
2. System displays a list of all customers with name, email, phone, registration date, and order count.
3. Admin can search or filter the customer list.

**Postconditions:** Admin has visibility into the customer base.

---

## UC-19: System — Send Order Confirmation Email

| Field | Detail |
|-------|--------|
| **Actor** | Email System (triggered by System after UC-07) |
| **Description** | System automatically sends a booking confirmation email to the customer and a notification to admin after a successful payment. |
| **Preconditions** | A package booking payment has been confirmed (UC-07). |

**Main Flow:**
1. System collects order details (order number, event name, event date/time/venue, package tier, total amount, line items).
2. Email System sends a confirmation email to the customer containing the full order summary.
3. Email System sends a "New Order" notification email to the admin inbox.

**Alternative Flows:**
- *2a.* Email delivery fails → System logs the error silently; order remains confirmed.

**Postconditions:** Customer and admin both receive email notifications about the new booking.

---

## UC-20: System — Send Cancellation & Refund Email

| Field | Detail |
|-------|--------|
| **Actor** | Email System (triggered by System after UC-12) |
| **Description** | System automatically sends a cancellation confirmation email to the customer after a booking is cancelled. |
| **Preconditions** | A booking cancellation has been processed (UC-12). |

**Main Flow:**
1. System collects cancellation details (event name, order number, total paid, cancellation fee, refund amount).
2. Email System sends a cancellation email to the customer showing:
   - Event name and order number
   - Cancellation fee (10%)
   - Refund amount (90%)
   - Note that refund takes 3–5 business days

**Postconditions:** Customer receives email confirming the cancellation and refund details.

---

## Use Case Summary Table

| ID | Use Case | Primary Actor | Complexity |
|----|----------|--------------|------------|
| UC-01 | Register Account | Customer | Low |
| UC-02 | Login | Customer / Admin | Low |
| UC-03 | Logout | Customer / Admin | Low |
| UC-04 | Create Event | Customer | Medium |
| UC-05 | Browse and Select a Package | Customer | Low |
| UC-06 | Customise Package and Add to Cart | Customer | Medium |
| UC-07 | Checkout and Pay for Package | Customer, Stripe | High |
| UC-08 | View Event Plan | Customer | Medium |
| UC-09 | Mark Checklist Step as Complete | Customer | Low |
| UC-10 | Edit Event Details | Customer | Medium |
| UC-11 | Adjust Guest Count on Paid Event | Customer, Stripe | High |
| UC-12 | Cancel Booking | Customer, Stripe, Email | High |
| UC-13 | Browse Shop and Add Products to Cart | Customer | Low |
| UC-14 | View Orders | Customer | Low |
| UC-15 | View Notifications | Customer | Low |
| UC-16 | Admin — View Dashboard | Admin | Low |
| UC-17 | Admin — Manage Orders | Admin | Medium |
| UC-18 | Admin — View Customers | Admin | Low |
| UC-19 | System — Send Order Confirmation Email | Email System | Low |
| UC-20 | System — Send Cancellation & Refund Email | Email System | Low |
