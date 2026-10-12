export type TiptapDocument = {
  type: 'doc';
  content: unknown[];
};

export const EMPTY_TIPTAP_DOCUMENT: TiptapDocument = {
  type: 'doc',
  content: [],
};
