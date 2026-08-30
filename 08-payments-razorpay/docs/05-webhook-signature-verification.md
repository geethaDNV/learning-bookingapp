# 05. Webhook Signature Verification

Why webhooks need signatures, how to verify them, and common mistakes.

## The Security Problem

### Scenario

Your server receives:
```
POST /api/v1/payments/webhooks/razorpay
X-Razorpay-Signature: abc123

{
  "id": "event_123",
  "event": "payment_link.paid",
  "payload": { ... }
}
```

### Questions

1. Did this really come from Razorpay?
2. Was the request modified in transit?
3. Could someone fake a payment success webhook?

**Without signature verification: YES, they could fake it!**

### The Answer: HMAC-SHA256

```
Razorpay takes:
  1. Request body (JSON)
  2. Your webhook secret (from dashboard)
  
And creates:
  signature = HMAC-SHA256(body, secret)

Razorpay sends:
  X-Razorpay-Signature: [signature]

Your code:
  1. Calculate: expected = HMAC-SHA256(body, secret)
  2. Compare: signature == expected
  3. If yes: trust the webhook
  4. If no: reject it (fake!)
```

## How It Works

### Step 1: Razorpay Prepares Webhook

```
Webhook event happens:
  Payment captured for ₹5,000

Razorpay's system:
  body = JSON.stringify({
    id: "event_12345",
    event: "payment_link.paid",
    payload: { ... }
  })
  
  secret = config.razorpay.webhookSecret  // From dashboard
  
  signature = hmac_sha256(body, secret)
  // e.g., "d41d8cd98f00b204e9800998ecf8427e"
```

### Step 2: Razorpay Sends Webhook

```
POST https://your-app.com/api/v1/payments/webhooks/razorpay HTTP/1.1
Content-Type: application/json
X-Razorpay-Signature: d41d8cd98f00b204e9800998ecf8427e

{
  "id": "event_12345",
  "event": "payment_link.paid",
  "payload": { ... }
}
```

### Step 3: Your Server Receives & Verifies

```typescript
// backend/src/controllers/PaymentController.ts
async handleRazorpayWebhook(req: Request, res: Response) {
  // Get raw body (unchanged request body)
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  
  // Get signature header
  const signature = req.headers["x-razorpay-signature"] as string;
  
  // Verify signature
  if (!this.gatewayProvider.verifyWebhook(rawBody, signature)) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid signature" }
    });
    return;
  }
  
  // If we get here, signature is valid!
  // Safe to process the webhook
}
```

### Step 4: Signature Verification Logic

```typescript
// backend/src/services/RazorpayGatewayProvider.ts
verifyWebhook(rawBody: Buffer, signature: string): boolean {
  const secret = config.razorpay.webhookSecret;
  if (!secret || !signature) return false;

  // Calculate expected signature
  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody)     // MUST be raw body, not parsed JSON!
    .digest("hex");      // Convert to hex string

  // Safe comparison (prevent timing attacks)
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
```

## Critical: Raw Body vs Parsed JSON

### ❌ WRONG: Using Parsed JSON

```typescript
// DON'T DO THIS!
const body = req.body;  // Already parsed JSON object
const signature = req.headers["x-razorpay-signature"];

// This will FAIL verification!
const hash = hmac("sha256", secret, JSON.stringify(body));
// Different whitespace/formatting = different hash
```

### ✓ CORRECT: Using Raw Buffer

```typescript
// DO THIS!
const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
const signature = req.headers["x-razorpay-signature"];

// This works because we use exact same bytes Razorpay used
const hash = hmac("sha256", secret, rawBody);
```

### Why the Difference?

```
Razorpay sent:
  {"id":"event_123","event":"payment_link.paid"}

Express parsed it to:
  {
    "id": "event_123",
    "event": "payment_link.paid"
  }

If you stringify the parsed version:
  {"id":"event_123","event":"payment_link.paid"}

They match! But if Express changes parsing...
Or if there's extra whitespace...
The hash will differ!
```

## Implementation: Raw Body Middleware

You need middleware to capture raw body before Express parses it:

```typescript
// backend/src/middleware/errorHandler.ts
export function rawBodyMiddleware(
  req: Request & { rawBody?: Buffer },
  res: Response,
  next: NextFunction
) {
  const chunks: Buffer[] = [];

  req.on("data", (chunk) => {
    chunks.push(chunk);
  });

  req.on("end", () => {
    req.rawBody = Buffer.concat(chunks);  // Store raw body
    next();
  });
}
```

Register before JSON parser:

```typescript
// backend/src/server.ts
app.use(rawBodyMiddleware);        // Capture raw body first
app.use(express.json());           // Then parse JSON
app.use("/api/v1/payments", routes); // Then route
```

## Webhook Structure

### Razorpay Webhook Example

```json
{
  "id": "event_1692864000",
  "event": "payment_link.paid",
  "created_at": 1692864000,
  "payload": {
    "payment_link": {
      "entity": {
        "id": "plink_1234567890",
        "reference_id": "pay_abc123",
        "status": "completed",
        "amount_paid": 500000,
        "notes": {
          "invoiceId": "inv_456",
          "customerId": "cust_789"
        }
      }
    },
    "payment": {
      "entity": {
        "id": "pay_xyz123",
        "amount": 500000,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

### Events You'll See

| Event | Meaning | Status |
|-------|---------|--------|
| `payment_link.created` | Link was created | PENDING |
| `payment_link.paid` | Payment succeeded | CAPTURED |
| `payment_link.cancelled` | Link expired or cancelled | FAILED |
| `payment.authorized` | Payment authorized (pre-capture) | PENDING |
| `payment.failed` | Payment failed (card declined, etc) | FAILED |
| `refund.created` | Refund requested | REFUNDING |
| `refund.processed` | Refund successful | REFUNDED |

## Testing Signature Verification

### With Mock Provider

Mock signing works locally:

```typescript
// backend/src/services/MockPaymentGatewayProvider.ts
const mockSecret = "mock-webhook-secret-for-learning";

// To test, create a signed mock webhook:
const payload = {
  id: "mock-event-123",
  eventType: "payment.captured",
  amount: 5000
};

const rawBody = Buffer.from(JSON.stringify(payload));
const signature = createHmac("sha256", mockSecret)
  .update(rawBody)
  .digest("hex");

// Send this with header:
// X-Razorpay-Signature: [signature]
// Body: [rawBody]
```

### With Razorpay Sandbox

1. Get your webhook secret from dashboard
2. Set in .env: `RAZORPAY_WEBHOOK_SECRET=xxx`
3. Create a test payment link
4. Go through payment flow (use test card)
5. Razorpay sends webhook automatically
6. Your server verifies and processes it

### Manual Testing with cURL

```bash
# Create a test event
WEBHOOK_SECRET="your-webhook-secret"
BODY='{"id":"event_123","event":"payment_link.paid"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | sed 's/.* //')

# Send webhook
curl -X POST http://localhost:3001/api/v1/payments/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: $SIGNATURE" \
  -d "$BODY"
```

## Timing-Safe Comparison

### Why timingSafeEqual()?

```typescript
// VULNERABLE: Normal comparison
if (signature === expectedSignature) { ... }

// Problem: Takes same time to compare regardless of first difference
// Attacker can use timing to guess signature bit by bit
// Called "timing attack"

// SAFE: Timing-safe comparison
import { timingSafeEqual } from "crypto";
timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))

// Takes same time regardless of where bytes differ
// Prevents timing attacks
```

## Common Mistakes

### ❌ 1. Parsing JSON Before Verification

```typescript
// WRONG
app.use(express.json());  // Parses and loses raw body
app.post("/webhook", (req) => {
  const body = req.body;  // Too late! Raw body lost
});

// RIGHT
app.use(rawBodyMiddleware);  // Capture first
app.use(express.json());      // Then parse
app.post("/webhook", (req) => {
  const rawBody = (req as any).rawBody;  // Raw body available
});
```

### ❌ 2. Wrong Webhook Secret

```typescript
// WRONG
const secret = config.razorpay.keySecret;  // Using API key secret!

// RIGHT
const secret = config.razorpay.webhookSecret;  // Use webhook secret
```

### ❌ 3. Signature as String Instead of Hex

```typescript
// WRONG
const hash = hmac("sha256", secret, rawBody).toString();

// RIGHT
const hash = hmac("sha256", secret, rawBody).digest("hex");
```

## Debugging Failed Verification

### Checklist

- [ ] Is `X-Razorpay-Signature` header present?
- [ ] Is `RAZORPAY_WEBHOOK_SECRET` set in `.env`?
- [ ] Are you using raw body, not parsed JSON?
- [ ] Is middleware order correct (rawBodyMiddleware before express.json)?
- [ ] Is signature in hex format?
- [ ] Did you restart server after changing `.env`?

### Log for Debugging

```typescript
verifyWebhook(rawBody: Buffer, signature: string): boolean {
  console.log("Raw body:", rawBody.toString("utf8"));
  console.log("Signature header:", signature);
  console.log("Webhook secret:", config.razorpay.webhookSecret);
  
  const expected = createHmac("sha256", config.razorpay.webhookSecret)
    .update(rawBody)
    .digest("hex");
  
  console.log("Expected signature:", expected);
  console.log("Match:", signature === expected);
  
  return signature === expected;
}
```

## Next Steps

- Read `06-webhook-event-processing.md` for what happens after verification
