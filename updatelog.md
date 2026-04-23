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
- Completed another worker batch across `Manage`, `Add/Edit`, `Detail Page`, and shared `Mobile UX` tasks.
- Added Manage-to-form focus behavior, explicit detail links from Manage rows, and sticky mobile Manage controls.
- Improved the edit form section focus behavior and simplified the mobile edit layout without changing the design system.
- Refined the detail page with clearer action sections, compact metadata, better back navigation, and explicit ownership actions.
- Tightened Library/Wishlist mobile filters, card tap targets, bottom-nav behavior, and phone-specific card density/button sizing.
- Completed the `Visual Polish` todo section with a warmer global shell palette, standardized filter panels, and a stronger shared card treatment.
- Updated Library, Wishlist, and Manage filters to use the same compact panel structure with clearer labels, live result summaries, and more visible segmented controls.
- Refined book cards with denser grid sizing, stronger unclipped focus states, richer fallback cover art, and genre-aware tag/fallback styling.
- Moved the decorative search icon to the leading side of the Library, Wishlist, and Manage search fields so it no longer overlaps the native clear button.
- Increased leading padding on those same search fields so the magnifying glass also clears the placeholder text.
- Completed the `Series` and `Genres` discovery pages from the `Search And Discovery` section.
- Added a grouped `Series` browser with ownership filtering, deferred search, density controls, and series-order shelves, including a standalone-books summary.
- Added a `Genres` page with genre shelf groupings, quick-jump links, visible Library/Wishlist orientation, and a secondary browse mode that stays outside primary navigation.
- Refined the discovery UI with mobile-friendly carousel layouts, motion-safe loading skeletons, and clearer Library entry points into the Series and Genres pages.
- Tightened the discovery pages to use the shared shelf card treatment more directly, fixed wishlist inclusion in both browsers, removed clipped hover/extra wrapper whitespace, and softened the Library discovery cards.
- Verified the changes with `npm run lint` and `npm run build`.
