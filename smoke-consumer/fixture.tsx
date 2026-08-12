type Invoice = {
  id: string;
  total: number;
};

type InvoiceListProps = {
  invoices: readonly Invoice[];
  onCreate: () => void;
};

export function InvoiceList({ invoices, onCreate }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <section aria-labelledby="invoice-empty">
        <h2 id="invoice-empty">No invoices</h2>
        <p>Create an invoice to begin.</p>
        <button type="button" onClick={onCreate}>
          Create invoice
        </button>
      </section>
    );
  }

  return (
    <ul aria-label="Invoices">
      {invoices.map((invoice) => (
        <li key={invoice.id}>
          {invoice.id}: {invoice.total}
        </li>
      ))}
    </ul>
  );
}
