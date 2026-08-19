import { plugin, settings, tester, tsTester } from "./rule-tester.mjs";

tester.run("no-placeholder-copy", plugin.rules["no-placeholder-copy"], {
  valid: [
    {
      code: "const label = 'todo';",
      settings,
    },
    {
      code: "export function View() { return <input className=\"placeholder:text-muted\" />; }",
      settings,
    },
    {
      code: "const copy = { internal: `Coming soon` };",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <p>Coming soon</p>; }",
      settings,
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: "export function View() { return <input placeholder=\"Coming soon\" />; }",
      settings,
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: "const copy = { emptyMessage: `TBD` };",
      settings,
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: "const copy = { title: 'Lorem ipsum dashboard' };",
      errors: [{ messageId: "placeholder" }],
    },
  ],
});

tester.run("no-marketing-copy", plugin.rules["no-marketing-copy"], {
  valid: [
    {
      code: "export function View() { return <p>Run payroll for contractors</p>; }",
      settings,
    },
    {
      code: "const message = 'unlock powerful internals';",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <p>Unlock powerful insights</p>; }",
      settings,
      errors: [{ messageId: "marketing" }],
    },
    {
      code: "const copy = { description: `Supercharge payroll` };",
      settings,
      errors: [{ messageId: "marketing" }],
    },
  ],
});

tester.run("require-empty-state-action", plugin.rules["require-empty-state-action"], {
  valid: [
    {
      code: "export function View() { return <section><p>No invoices</p><button>Create invoice</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices. Clear filter to see more.</p></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>Nothing found</p><a href=\"/settings\">Open settings</a></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><div onClick={() => retry()}><p>0 results</p></div></section>; }",
      settings,
    },
    {
      code: "export function View() { return <p>No action required.</p>; }",
      settings,
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p><span>No invoices</span></p><button>Retry</button></div>; }",
      settings,
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p><span>No invoices.</span><span>Create an invoice to begin.</span></p></div>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{false && 'No invoices'}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{undefined && <p>No invoices</p>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{void 0 && <p>No invoices</p>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{!true && <p>No invoices</p>}{!!false && <p>No invoices</p>}{-0 && <p>No invoices</p>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{'No action required' || 'No invoices'}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled={false}>Retry</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button aria-disabled=\"false\">Retry</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><input hidden={false} /></section>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{empty && <p>No invoices</p>}{empty && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><legend><button>Retry</button></legend></fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{items.length === 0 && <p>No invoices</p>}{items.length === 0 && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset aria-disabled=\"true\"><button>Retry</button></fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><><legend><button>Retry</button></legend></></fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><React.Fragment><legend><button>Retry</button></legend></React.Fragment></fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><Fieldset disabled><button>Retry</button></Fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={undefined}><button>Retry</button></div></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a disabled href=\"/retry\">Retry</a></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a onClick={() => act()}>Go</a></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div disabled onClick={() => act()}>Go</div></section>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{a && b && <p>No invoices</p>}{a && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{a && !b && <p>No invoices</p>}{a && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{a && b ? <p>No invoices</p> : null}{a && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{a && (b && c) && <p>No invoices</p>}{c && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{empty === true && <p>No invoices</p>}{empty && <button>Retry</button>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{empty === false && <p>No invoices</p>}{!empty && <button>Retry</button>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled={void 0}>Go</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button aria-disabled={void 0}>Retry</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled>Retry</button>Create an invoice to begin.</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a href={`/retry`}>Go</a></section>; }",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <section><p>No invoices</p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section>{empty ? 'Nothing found' : 'No invoices'}</section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><div className=\"empty-state\"><p>No invoices</p></div><footer><button>Create invoice</button></footer></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled>Retry</button></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a>Open settings</a></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><input type=\"hidden\" value=\"retry\" /></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled=\"false\">Retry</button></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><input hidden=\"false\" /></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div hidden><button>Retry</button></div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section>{empty ? <p>No invoices</p> : <button>Retry</button>}</section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No <strong>invoices</strong></p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p>{empty ? 'No invoices' : 'Create an invoice'}</p></div>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p>{empty ? 'No invoices' : 'Loaded'}</p>{!empty && <button>Retry</button>}</div>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><button>Retry</button></fieldset></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <div>{empty && <p>No invoices</p>}<fieldset disabled>{empty && <legend>Info</legend>}<legend><button>Retry</button></legend></fieldset></div>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><Legend><button>Retry</button></Legend></fieldset></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "const Fragment = ({ children }) => <div>{children}</div>; export function View() { return <section><p>No invoices</p><fieldset disabled><Fragment><legend><button>Retry</button></legend></Fragment></fieldset></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><Button disabled>Retry</Button></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={true}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick=\"handler\">Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={void 0}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={false && retry}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={true ? false : retry}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={false ? retry : false}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={undefined ?? false}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p>{a0 ? <button>Retry</button> : null}{a1 ? <button>Retry</button> : null}{a2 ? <button>Retry</button> : null}{a3 ? <button>Retry</button> : null}{a4 ? <button>Retry</button> : null}{a5 ? <button>Retry</button> : null}{a6 ? <button>Retry</button> : null}</section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p>{a0 ? 'Retry' : null}{a1 ? 'Retry' : null}{a2 ? 'Retry' : null}{a3 ? 'Retry' : null}{a4 ? 'Retry' : null}{a5 ? 'Retry' : null}{a6 ? 'Retry' : null}</section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p><>No invoices</></p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><button disabled>No invoices</button></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <div>{a && b && <p>No invoices</p>}{!a && <button>Retry</button>}</div>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
  ],
});

tsTester.run("require-empty-state-action TypeScript", plugin.rules["require-empty-state-action"], {
  valid: [
    {
      code: `type Invoice = { id: string };
export function InvoiceList({ invoices, onCreate }: { invoices: readonly Invoice[]; onCreate: () => void }) {
  if (invoices.length === 0) {
    return <section><h2>No invoices</h2><button type="button" onClick={onCreate}>Create invoice</button></section>;
  }
  return <ul>{invoices.map((invoice) => <li key={invoice.id}>{invoice.id}</li>)}</ul>;
}`,
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p>{(<button>Go</button> as unknown as JSX.Element)}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p>{(<button>Go</button> satisfies JSX.Element)}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button aria-disabled={(false as boolean)}>Retry</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a href={(\"/retry\" as string)}>Go</a></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><input type={(\"text\" as const)} /></section>; }",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <section><p>{(\"No invoices\" as string)}</p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>{(\"No invoices\" satisfies string)}</p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>{(\"No invoices\"!)}</p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
  ],
});

tester.run("no-generic-stat-label", plugin.rules["no-generic-stat-label"], {
  valid: [
    {
      code: "export function View() { return <h2>Failed payments</h2>; }",
      settings,
    },
    {
      code: "export function View() { return <h2>{title}</h2>; }",
      settings,
    },
    {
      code: "export function View() { return <Metric description=\"Analytics\" />; }",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <h2>Analytics</h2>; }",
      settings,
      errors: [{ messageId: "genericLabel" }],
    },
    {
      code: "export function View() { return <Metric label=\"Usage\" />; }",
      settings,
      errors: [{ messageId: "genericLabel" }],
    },
    {
      code: "export function View() { return <Metric title={`Overview`} />; }",
      settings,
      errors: [{ messageId: "genericLabel" }],
    },
  ],
});
