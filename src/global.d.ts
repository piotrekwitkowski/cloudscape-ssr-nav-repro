declare module "*.css";

// HACK: Cloudscape types use the global JSX namespace (React 18 style) which is
// incompatible with @types/react 19's React.JSX namespace. Re-exporting from
// React.JSX bridges the gap. Remove once Cloudscape targets React 19 types.
declare namespace JSX {
  export import IntrinsicElements = React.JSX.IntrinsicElements;
  export import Element = React.JSX.Element;
}
