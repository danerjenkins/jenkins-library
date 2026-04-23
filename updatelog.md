# Update Log

## 2026-04-23

- Completed the full `Library And Wishlist` todo section in `todolist.md`.
- Strengthened Library and Wishlist card affordance with clearer hover/focus treatment and a `View Details` cue.
- Added shared card-size persistence across Library and Wishlist with a mobile default of `Small`.
- Added persistent Library/Wishlist view preferences with URL-synced filters and Library sort state.
- Kept the existing card-size control in place instead of adding a separate compact/comfortable toggle.
- Improved empty states on Library and Wishlist with direct add actions that open Manage in the correct ownership mode.
- Completed the `Manage Page` todo section with compact operational rows, aligned metadata badges, quick ownership toggles, and a real delete confirmation dialog.
- Completed the `Add/Edit Book Flow` todo section with a shorter default form, save-state messaging, unsaved-change protection, and clearer cover-source handling.
- Integrated worker changes in `AdminBooksPage.tsx` so form save feedback, dirty-state session keys, and global success/error status all work together.
- Verified the changes with `npm run lint` and `npm run build`.
