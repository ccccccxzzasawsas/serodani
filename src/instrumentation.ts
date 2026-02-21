/**
 * Next.js instrumentation — სერვერის გაშვებისას კონსოლის ლოგები გამორთულია.
 * ბრაუზერში იგივე აკეთებს layout.tsx-ის inline script.
 */
const noop = () => {}

export async function register() {
  if (typeof console !== "undefined") {
    console.log = noop
    console.info = noop
    console.debug = noop
    console.warn = noop
    console.error = noop
  }
}
