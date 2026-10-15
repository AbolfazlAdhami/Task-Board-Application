import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function onlyKeys(value: JsonObject, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

@ValidatorConstraint({ name: 'isTiptapDocument', async: false })
export class TiptapDocumentValidator implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    console.log(
      '[Tiptap Validation] Received:',
      JSON.stringify(value, null, 2),
    );

    if (
      !isObject(value) ||
      value.type !== 'doc' ||
      !onlyKeys(value, ['type', 'content']) ||
      !Array.isArray(value.content)
    ) {
      console.log('[Tiptap Validation] Invalid document root');
      return false;
    }

    const valid = value.content.every((node) => this.isBlock(node, 0));

    if (!valid) {
      console.log('[Tiptap Validation] Invalid block node');
    }

    return valid;
  }

  defaultMessage(): string {
    return 'description must be a valid supported TipTap document';
  }

  private isBlock(value: unknown, depth: number): boolean {
    if (depth > 64 || !isObject(value) || typeof value.type !== 'string') {
      return false;
    }

    const content = value.content;

    switch (value.type) {
      case 'paragraph':
        return (
          onlyKeys(value, ['type', 'content']) &&
          (content === undefined ||
            (Array.isArray(content) &&
              content.every((node) => this.isInline(node))))
        );

      case 'heading': {
        if (
          !onlyKeys(value, ['type', 'attrs', 'content']) ||
          !isObject(value.attrs) ||
          !onlyKeys(value.attrs, ['level']) ||
          !Number.isInteger(value.attrs.level) ||
          (value.attrs.level as number) < 1 ||
          (value.attrs.level as number) > 6
        ) {
          return false;
        }

        return (
          content === undefined ||
          (Array.isArray(content) &&
            content.every((node) => this.isInline(node)))
        );
      }

      case 'blockquote':
        return (
          onlyKeys(value, ['type', 'content']) &&
          Array.isArray(content) &&
          content.length > 0 &&
          content.every((node) => this.isBlock(node, depth + 1))
        );

      case 'bulletList':
        return (
          onlyKeys(value, ['type', 'content']) &&
          Array.isArray(content) &&
          content.length > 0 &&
          content.every(
            (node) =>
              isObject(node) &&
              node.type === 'listItem' &&
              this.isBlock(node, depth + 1),
          )
        );

      case 'orderedList':
        return (
          onlyKeys(value, ['type', 'attrs', 'content']) &&
          this.validOrderedListAttrs(value.attrs) &&
          Array.isArray(content) &&
          content.length > 0 &&
          content.every(
            (node) =>
              isObject(node) &&
              node.type === 'listItem' &&
              this.isBlock(node, depth + 1),
          )
        );

      case 'listItem':
        return (
          onlyKeys(value, ['type', 'content']) &&
          Array.isArray(content) &&
          content.length > 0 &&
          content.every((node) => this.isBlock(node, depth + 1))
        );

      default:
        return false;
    }
  }

  private validOrderedListAttrs(value: unknown): boolean {
    if (value === undefined) return true;
    if (!isObject(value) || !onlyKeys(value, ['start', 'type'])) return false;

    const validStart =
      value.start === undefined ||
      (Number.isInteger(value.start) && (value.start as number) >= 1);

    const validType =
      value.type === undefined ||
      value.type === null ||
      (typeof value.type === 'string' &&
        ['1', 'a', 'A', 'i', 'I'].includes(value.type));

    return validStart && validType;
  }

  private isInline(value: unknown): boolean {
    if (!isObject(value) || typeof value.type !== 'string') return false;

    if (value.type === 'text') {
      return (
        onlyKeys(value, ['type', 'text', 'marks']) &&
        typeof value.text === 'string' &&
        value.text.length > 0 &&
        (value.marks === undefined || this.validMarks(value.marks))
      );
    }

    if (value.type === 'hardBreak') {
      return (
        onlyKeys(value, ['type', 'marks']) &&
        (value.marks === undefined || this.validMarks(value.marks))
      );
    }

    return false;
  }

  private validMarks(value: unknown): boolean {
    if (!Array.isArray(value)) return false;

    const seen = new Set<string>();

    return value.every((mark) => {
      if (!isObject(mark) || typeof mark.type !== 'string') return false;
      if (seen.has(mark.type)) return false;
      seen.add(mark.type);

      if (mark.type === 'bold' || mark.type === 'italic') {
        return onlyKeys(mark, ['type']);
      }

      if (
        mark.type !== 'link' ||
        !onlyKeys(mark, ['type', 'attrs']) ||
        !isObject(mark.attrs) ||
        !onlyKeys(mark.attrs, ['href', 'target', 'rel', 'class', 'title']) ||
        typeof mark.attrs.href !== 'string'
      ) {
        return false;
      }

      try {
        const url = new URL(mark.attrs.href);

        if (
          !['http:', 'https:'].includes(url.protocol) ||
          !url.hostname ||
          url.username ||
          url.password
        ) {
          return false;
        }
      } catch {
        return false;
      }

      const target = mark.attrs.target;
      if (
        target !== undefined &&
        target !== null &&
        target !== '_blank' &&
        target !== '_self'
      ) {
        return false;
      }

      const rel = mark.attrs.rel;
      if (rel !== undefined && rel !== null && typeof rel !== 'string') {
        return false;
      }

      const className = mark.attrs.class;
      if (
        className !== undefined &&
        className !== null &&
        (typeof className !== 'string' ||
          !/^[a-zA-Z0-9 _-]{0,100}$/.test(className))
      ) {
        return false;
      }

      return true;
    });
  }
}
