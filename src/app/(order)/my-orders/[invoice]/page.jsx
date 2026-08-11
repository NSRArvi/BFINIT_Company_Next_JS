import OrderConfirmation from "@/components/order/OrderConfirmation/OrderConfirmation";
import PrivateRoute from "@/components/PrivateRoute/PrivateRoute";

export default async function page({ params }) {
  const { invoice } = await params;
  return (
    <PrivateRoute>
      <OrderConfirmation invoice={invoice} />
    </PrivateRoute>
  );
}
