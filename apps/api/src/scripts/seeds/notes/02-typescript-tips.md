# TypeScript Tips I Keep Forgetting

Quick reference for patterns I use often but forget the syntax for.

## Utility Types

```typescript
Partial<T>      // All properties optional
Required<T>     // All properties required
Pick<T, K>      // Select specific keys
Omit<T, K>      // Exclude specific keys
Record<K, V>    // Object with key type K and value type V
```

## Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

## Discriminated Unions

```typescript
type Result =
  | { status: 'success'; data: string }
  | { status: 'error'; message: string };
```

## Generic Constraints

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}
```

These patterns make code safer and more readable. Worth memorizing.
