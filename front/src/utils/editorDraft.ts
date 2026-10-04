/** Notify the open editor only after the server has accepted its content. */
export function markEditorSaved(key: string) {
  window.dispatchEvent(new CustomEvent('trav:editor-saved', { detail: key }));
}
