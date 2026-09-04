/**
 * Renders "a / b" with a forced LTR direction so digits + slash don't get
 * visually reordered by the bidi algorithm inside RTL (Hebrew) paragraphs.
 */
export function Fraction({ a, b }: { a: number | string; b: number | string }) {
  return (
    <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
      {a} / {b}
    </span>
  );
}
