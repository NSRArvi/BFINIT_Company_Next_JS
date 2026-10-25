"use client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StripeCardForm from "../Checkout/StripeCardForm";
import { STRIPE_PUBLISHABLE_KEY } from "@/config";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function RepayStripeDialog({ payment, onClose, onVerified }) {
  return (
    <Dialog open={!!payment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            Pay €{payment?.amount} · {payment?.package?.name}
          </DialogTitle>
        </DialogHeader>

        {payment && (
          <Elements
            key={payment.client_secret}
            stripe={stripePromise}
            options={{
              clientSecret: payment.client_secret,
              appearance: { theme: "none" },
            }}
          >
            <StripeCardForm
              clientSecret={payment.client_secret}
              orderData={{
                invoice: {
                  invoice_number: payment.invoice_number,
                  payment_amount: payment.amount,
                },
              }}
              onBack={onClose}
              onSuccess={(pi) => onVerified(pi, payment.invoice_number)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
