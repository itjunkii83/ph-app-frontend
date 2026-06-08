import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// eslint-config-next bundles eslint-plugin-react-hooks but does not hoist it to
// this app under pnpm, so a standalone override object can't resolve the plugin
// by name. Reuse the instance eslint-config-next already registered, so we can
// downgrade its new (v7) rules to warnings without re-resolving or redefining it.
const reactHooks = nextCoreWebVitals
  .map((c) => c.plugins && c.plugins["react-hooks"])
  .find(Boolean);

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "node_modules/**", "ref/**"],
  },
  {
    // eslint-config-next 16 upgrades eslint-plugin-react-hooks to v7, which adds
    // new React-Compiler-era rules that flag pre-existing patterns across the
    // codebase. Keep them as warnings to preserve the prior lint baseline so the
    // framework migration doesn't bundle an unrelated hooks refactor. The
    // critical react-hooks/rules-of-hooks rule remains an error.
    ...(reactHooks ? { plugins: { "react-hooks": reactHooks } } : {}),
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
];

export default eslintConfig;
