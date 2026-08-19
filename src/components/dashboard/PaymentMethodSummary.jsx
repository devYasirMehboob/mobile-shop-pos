import { formatCurrency } from "../../utils/calculateSaleTotals";

const labels = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
};

function PaymentMethodSummary({ methods = [] }) {
  const methodList = Array.isArray(methods) ? methods : [];
  const total = methodList.reduce((sum, item) => sum + Number(item.total || 0), 0);

  return (
    <section className="premium-surface rounded-xl p-5 sm:p-6">
      <h3 className="text-base font-extrabold text-slate-900">Payment methods</h3>
      <p className="mt-1 text-xs text-slate-500">Completed sales breakdown.</p>
      
      {methodList.length === 0 ? (
        <p className="py-14 text-center text-sm text-slate-400">No payment data available.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {methodList.map((item, index) => {
            const keyName = item.payment_method || item.method || `method-${index}`;
            const labelText = labels[keyName] || item.label || keyName;
            const salesCount = item.sales_count ?? item.count ?? 0;
            const percent = total > 0 ? (Number(item.total || 0) / total) * 100 : 0;

            return (
              <div key={keyName}>
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-700 capitalize">{labelText}</span>
                  <span className="text-right text-slate-500">
                    {formatCurrency(item.total || 0)}{" "}
                    <small className="ml-1 text-slate-400">({salesCount})</small>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default PaymentMethodSummary;
