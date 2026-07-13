import { plugin, settings, tester, tsTester } from "./rule-tester.mjs";

tester.run("no-gradient-text", plugin.rules["no-gradient-text"], {
  valid: [
    "export function View() { return <h1 className=\"text-brand\">Revenue</h1>; }",
    "export function View() { return <h1 style={{ color: '#234' }}>Revenue</h1>; }",
    "export function View() { return <h1 className={hero ? 'bg-gradient-to-r from-red-500 to-blue-500' : 'bg-clip-text text-transparent'}>Revenue</h1>; }",
  ],
  invalid: [
    {
      code: "export function View() { return <h1 className=\"bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent\">Revenue</h1>; }",
      errors: [{ messageId: "gradientText" }],
    },
    {
      code: "export function View() { return <h1 style={{ backgroundImage: 'linear-gradient(red, blue)', backgroundClip: 'text' }}>Revenue</h1>; }",
      errors: [{ messageId: "gradientText" }],
    },
  ],
});

tester.run("no-decorative-grid-background", plugin.rules["no-decorative-grid-background"], {
  valid: [
    "export function View() { return <div className=\"grid grid-cols-2 gap-4\" />; }",
    "const blueprintBackground = 'linear-gradient(#eee, #fff)';",
  ],
  invalid: [
    {
      code: "export function View() { return <div style={{ backgroundImage: 'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)' }} />; }",
      errors: [{ messageId: "decorativeGrid" }],
    },
    {
      code: "const background = `linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)`;",
      errors: [{ messageId: "decorativeGrid" }],
    },
  ],
});

tester.run("no-side-stripe-accent", plugin.rules["no-side-stripe-accent"], {
  valid: [
    "export function View() { return <aside className=\"border-l border-slate-300\" />; }",
    "export function View() { return <aside style={{ borderLeft: '1px solid red' }} />; }",
  ],
  invalid: [
    {
      code: "export function View() { return <aside className=\"border-l-4 border-red-500\" />; }",
      errors: [{ messageId: "sideStripe" }],
    },
    {
      code: "export function View() { return <aside style={{ borderLeftWidth: 6 }} />; }",
      errors: [{ messageId: "sideStripe" }],
    },
  ],
});

tester.run("no-excessive-radius", plugin.rules["no-excessive-radius"], {
  valid: [
    "export function View() { return <button className=\"rounded-full\">Save</button>; }",
    "export function View() { return <section style={{ borderRadius: 16 }} />; }",
  ],
  invalid: [
    {
      code: "export function View() { return <section className=\"rounded-[40px]\" />; }",
      errors: [{ messageId: "excessiveRadius" }],
    },
    {
      code: "export function View() { return <section style={{ borderRadius: '2rem' }} />; }",
      errors: [{ messageId: "excessiveRadius" }],
    },
    {
      code: "export function View() { return <section className=\"rounded-[20px]\" />; }",
      options: [{ maxRadiusPx: 16 }],
      errors: [{ messageId: "excessiveRadius" }],
    },
  ],
});

tester.run("no-excessive-radius maxRadiusPx option", plugin.rules["no-excessive-radius"], {
  valid: [
    {
      code: "export function View() { return <section className=\"rounded-[40px]\" />; }",
      options: [{ maxRadiusPx: 48 }],
    },
  ],
  invalid: [],
});

tester.run("no-arbitrary-z-index", plugin.rules["no-arbitrary-z-index"], {
  valid: [
    "export function View() { return <div className=\"z-50\" />; }",
    "export function View() { return <div style={{ zIndex: 20 }} />; }",
    "export function View() { return <div className={cn('fixed', false && 'z-[9999]')} />; }",
    "export function View() { return <div className={false ? 'z-[9999]' : 'z-50'} />; }",
    "export function View() { return <div className={undefined && 'z-[9999]'} />; }",
    "export function View() { return <div className={void 0 && 'z-[9999]'} />; }",
    "export function View() { return <div className={'z-50' || 'z-[9999]'} />; }",
    "export function View() { return <div className={`z-[${layer}]`} />; }",
  ],
  invalid: [
    {
      code: "export function View() { return <div className=\"z-[9999]\" />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div style={{ zIndex: 1000 }} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div className={cn('fixed', open && 'z-[9999]')} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div className={cn('fixed', open ? 'z-[9999]' : 'z-50')} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div className={clsx({ a: one, b: two, c: three, d: four, e: five, f: six, 'z-[9999]': seven })} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div className={`fixed z-[9999] ${extra}`} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div style={{ zIndex: 120 }} />; }",
      options: [{ maxZIndex: 100 }],
      errors: [{ messageId: "arbitraryZIndex" }],
    },
  ],
});

tester.run("no-arbitrary-z-index maxZIndex option", plugin.rules["no-arbitrary-z-index"], {
  valid: [
    {
      code: "export function View() { return <div style={{ zIndex: 5000 }} />; }",
      options: [{ maxZIndex: 9999 }],
    },
  ],
  invalid: [],
});

tester.run("require-reduced-motion", plugin.rules["require-reduced-motion"], {
  valid: [
    "export function View() { return <button className=\"px-3\">Save</button>; }",
    "export function View() { return <button className=\"transition-colors motion-reduce:transition-none\">Save</button>; }",
    "const css = '.item { transition: opacity .2s; } @media (prefers-reduced-motion: reduce) { .item { transition: none } }';",
    "const css = '.item { animation: fade-in .2s ease-out; } @media (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '.item { animation: spin 1s !important; } @media (prefers-reduced-motion: reduce) { .item { animation: none !important; } }';",
    "const css = '.item > .child { animation: spin 1s } @media (prefers-reduced-motion: reduce) { .item>.child { animation:none } }';",
    "const css = '@media screen { .item { animation: spin 1s } } @media screen and (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '@media (min-width: 640px) { .item { animation: spin 1s } } @media (min-width:640px) and (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '@media screen { .item { animation: spin 1s } } @media screen/**/and (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '@layer reset { .x { color:red } } .item { animation:spin 1s } @media (prefers-reduced-motion: reduce) { .item { animation:none } }';",
    "const css = '@media (prefers-reduced-motion: no-preference) { .item { transition: opacity .2s; } }';",
    "export function View() { return <button className=\"motion-safe:animate-pulse\">Save</button>; }",
    "export function View() { return <button className=\"hover:transition-transform motion-reduce:hover:transition-none\">Save</button>; }",
    "export function View() { return <button className=\"animate-none transition-none\">Save</button>; }",
    "export function View() { return <button className=\"animate-spin motion-reduce:animate-none\">Save</button>; }",
    "export function View() { return <button className=\"animate-none! transition-none!\">Save</button>; }",
    "export function View() { return <button className=\"animate-spin! motion-reduce:animate-none!\">Save</button>; }",
    "export function View() { return <button style={{ animation: 'none', animationName: 'none', transition: 'none' }}>Save</button>; }",
    "export function View() { return <button style={{ animation: null, animationName: false, transition: 0 }}>Save</button>; }",
    "const css = '.thing { --animation: fade; }';",
    "const css = '.thing { /* animation: spin 1s; */ color: red; }';",
    "const css = `.item::before { content: \"foo animation: spin 1s\"; }`;",
    "const css = `.item { content: \"}\"; animation: spin 1s; } @media (prefers-reduced-motion: reduce) { .item { animation:none } }`;",
    "const css = `.item { animation: spin 1s; } @media (prefers-reduced-motion: reduce) { .item { content: \"@scope\"; animation:none } }`;",
    "import { useReducedMotion } from 'framer-motion';\nexport function View() { const reduced = useReducedMotion(); return <button className={reduced ? '' : 'animate-pulse'}>Save</button>; }",
  ],
  invalid: [
    {
      code: "export function View() { return <button className=\"transition-opacity\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation: fade-in .2s ease-out; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"hover:transition-transform\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"md:animate-spin\">Load</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const note = 'motion-reduce: is a Tailwind variant';\nexport function View() { return <button className=\"transition-opacity\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <div><p className=\"transition-colors motion-reduce:transition-none\">Safe</p><p className=\"animate-pulse\">Unsafe</p></div>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"animate-spin motion-reduce:transition-none\">Load</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"transition-opacity motion-reduce:animate-none\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { * { animation: none } } .item { transition: opacity .2s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { * { color: red } } .item { animation: fade-in .2s ease-out; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.thing { animation: none, spin 1s linear infinite; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .other { animation: none; } } .thing { animation: fade 1s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .thing { animation: none; } } .thing, .other { animation: spin 1s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { * { animation: none; } } .thing { animation: spin 1s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .item { animation: none; } } .item { animation: spin 1s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .item { animation: spin 1s; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .item { animation: none; } .item { animation: spin 1s; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation: spin 1s !important; } @media (prefers-reduced-motion: reduce) { .item { animation: none; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media not all and (prefers-reduced-motion: no-preference) { .item { transition: opacity .2s; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: no-preference), (min-width: 10000px) { .item { transition: opacity .2s; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: no-preference) or (prefers-reduced-motion: reduce) { .item { animation: spin 1s } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation: spin 1s } @media (prefers-reduced-motion: reduce) { @media (prefers-reduced-motion: no-preference) { .item { animation:none } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@layer base, components; @layer components { .item { animation: spin 1s; } } @layer base { @media (prefers-reduced-motion: reduce) { .item { animation:none; } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.foo { & .item { animation:spin 1s } } @media (prefers-reduced-motion: reduce) { .bar { & .item { animation:none } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation:spin 1s } @media (prefers-reduced-motion: reduce) { .outside { .item { animation:none } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation:spin 1s } @media (prefers-reduced-motion: reduce) { @scope (.scoped) { .item { animation:none } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@layer { .item { animation:spin 1s !important } } @media (prefers-reduced-motion: reduce) { .item { animation:none !important } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = `.item { animation: spin 1s; } @media (prefers-reduced-motion: reduce) { .item { content: \"foo animation: none \"; } }`;",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = `.item { content: \"@media print {\"; animation: spin 1s; }`;",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = `.item { content: \"/*\"; animation: spin 1s; content: \"*/\"; }`;",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: String.raw`const css = '.x { content: "\\\\"; } .item { animation: spin 1s; }';`,
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"hover:transition-transform motion-reduce:transition-none\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"motion-reduce:animate-spin\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"!animate-spin\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"animate-spin! motion-reduce:animate-none\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"first:hover:animate-spin motion-reduce:hover:first:animate-none\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className={reduced ? 'motion-reduce:transition-none' : 'transition-opacity'}>Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
  ],
});

tsTester.run("require-reduced-motion TypeScript", plugin.rules["require-reduced-motion"], {
  valid: [],
  invalid: [
    {
      code: "export function View() { return <button style={({ animation: \"spin 1s\" } as unknown)}>Save</button>; }",
      settings,
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button style={{ animation: (\"spin 1s\" as const) }}>Save</button>; }",
      settings,
      errors: [{ messageId: "reducedMotion" }],
    },
  ],
});

tester.run("no-hidden-reveal-default", plugin.rules["no-hidden-reveal-default"], {
  valid: [
    "export function View() { return <section className=\"opacity-0\">Draft</section>; }",
    "export function View() { return <section className=\"opacity-100 transition-opacity\">Visible</section>; }",
    "export function View() { return <section className={cn('opacity-100', isOpen && 'transition-opacity')}>Visible</section>; }",
    "export function View() { return <section className={hidden ? 'opacity-0' : 'transition-opacity'}>Visible</section>; }",
    "export function View() { return <section className={cx({ 'opacity-0': false, 'transition-opacity': true })}>Visible</section>; }",
    "export function View() { return <section className={cn(false && 'opacity-0', 'transition-opacity')}>Visible</section>; }",
  ],
  invalid: [
    {
      code: "export function View() { return <section className=\"opacity-0 transition-opacity\">Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
    {
      code: "export function View() { return <section style={{ opacity: 0, transition: 'opacity .2s' }}>Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
    {
      code: "export function View() { return <section className={cn('opacity-0', isOpen && 'transition-opacity')}>Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
    {
      code: "export function View() { return <section className={clsx(['opacity-0', 'transition-opacity'])}>Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
    {
      code: "export function View() { return <section className={cx({ 'opacity-0': true, 'transition-opacity': isOpen })}>Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
  ],
});

tester.run("no-nested-cards", plugin.rules["no-nested-cards"], {
  valid: [
    "export function View() { return <Card><section>Details</section></Card>; }",
    "export function View() { return <div className=\"panel\"><div className=\"card\">Details</div></div>; }",
  ],
  invalid: [
    {
      code: "export function View() { return <div className=\"card\"><div className=\"card\">Nested</div></div>; }",
      errors: [{ messageId: "nestedCard" }],
    },
    {
      code: "export function View() { return <Card><MetricCard /></Card>; }",
      errors: [{ messageId: "nestedCard" }],
    },
  ],
});
