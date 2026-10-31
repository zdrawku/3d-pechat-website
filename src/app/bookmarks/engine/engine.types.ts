/**
 * The bookmark engine's contract, as published by `@printkit/bookmark-creator`.
 *
 * The package is the source of truth: its types, ids, limits and codes are what
 * the page codes against, and the page adapts to them. This file only re-exports
 * them, so the app imports engine types from one place.
 *
 * The site holds NO bookmark logic: colours, previews, name placement, shapes,
 * patterns, order files and print files all come from the engine. The site only
 * collects choices, shows what comes back and sends the order.
 */
export type {
  BookmarkEngine,
  BookmarkPrint,
  BookmarkRequest,
  ColourRole,
  CreatedOrder,
  Customer,
  EngineErrorInfo,
  EngineOptions,
  ErrorCode,
  Framing,
  Hex,
  Hole,
  PatternStyleId,
  Place,
  PreviewResult,
  PreviewWarning,
  WarningCode
} from '@printkit/bookmark-creator';
