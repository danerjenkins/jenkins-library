# Jenkins Library UX Todo List

## Primary Goal

Make the app easy and pleasant to use from a laptop or phone to:

- See books already owned
- See books wanted
- Add new books quickly
- Edit book details
- Move books between Wishlist and Library
- Track who has read each book

## Highest Priority

- [x] Rename `Admin` to `Manage`
  - Use friendlier navigation language.
  - Update route labels, page heading, and empty-state references.

- [x] Add a mobile bottom navigation
  - Include Library, Wishlist, Add, Manage, and Stats if space allows.
  - Keep desktop header navigation as-is or lightly refined.
  - Make the Add action reachable by thumb on phones.

- [x] Make the floating add button context-aware
  - From Library, default new books to `Owned`.
  - From Wishlist, default new books to `Wishlist`.
  - From Manage, preserve the active ownership tab/filter if possible.

- [x] Add Manage tabs for `Owned` and `Wishlist`
  - Replace or supplement the ownership filter with clearer tabs.
  - Keep search/filter controls below the tabs.
  - Make the current tab visually obvious.

- [x] Add `Move To Wishlist` and `Add To Library` actions on the detail page
  - Owned books should be movable to Wishlist.
  - Wishlist books should be movable to Library.
  - Keep the existing Wishlist card `Add To Library` button.

- [x] Make the book detail page the main state-change page
  - Keep read-status editing on detail.
  - Group actions into clear sections:
    - Read Status
    - Ownership
    - Edit Details

## Library And Wishlist

- [ ] Strengthen card click affordance
  - Make cards clearly clickable with hover/focus styling.
  - Consider a subtle “View Details” affordance on focus/hover.
  - Preserve a clean card design without edit/delete buttons.

- [ ] Remember card size per page
  - Persist Library card size in `localStorage`.
  - Persist Wishlist card size in `localStorage`.
  - Restore choices on page load.

- [ ] Remember sort and filter preferences
  - Persist Library sort option.
  - Consider persisting filters only if it does not make returning confusing.
  - Add a visible Clear Filters action when filters are active.

- [ ] Improve Wishlist empty states
  - Add an `Add Wishlist Book` action.
  - Open the add form with ownership set to Wishlist.

- [ ] Improve Library empty states
  - Add an `Add Book` action.
  - Open the add form with ownership set to Owned.

- [ ] Add a compact/comfortable view toggle later if needed
  - Keep current card-size control for now.
  - Revisit if too many size choices become noisy.

## Manage Page

- [ ] Keep Manage compact and operational
  - Continue using rows instead of large cards.
  - Keep small cover thumbnails.
  - Keep icon-only edit/delete buttons with accessible labels.

- [ ] Add bulk-friendly scanability
  - Align row metadata consistently.
  - Consider showing ownership, format, genre, and read status as compact badges.

- [ ] Add quick edit affordances for common fields
  - Consider inline ownership toggle.
  - Consider inline read-status summary only, not full editing.
  - Keep deeper edits in the form.

- [ ] Improve delete safety
  - Replace browser `confirm()` with a small confirmation dialog.
  - Include title and “This cannot be undone.”
  - Make destructive action visually distinct.

## Add/Edit Book Flow

- [ ] Make Add Book route state explicit
  - Support `/admin?add=1&ownership=wishlist`.
  - Support `/admin?add=1&ownership=owned`.
  - Use this for context-aware add actions.

- [ ] Shorten the initial add form
  - Prioritize Title, Author, Ownership, and optional cover lookup.
  - Keep advanced metadata collapsed until needed.

- [ ] Improve Save feedback
  - Show `Saving…` while submitting.
  - Show a success message after add/update.
  - Return users to the relevant page or stay in Manage depending on context.

- [ ] Add unsaved-change protection
  - Warn before leaving an edited form with unsaved changes.
  - Keep the warning scoped to meaningful changes.

- [ ] Improve cover handling
  - Make cover source clearer: URL, Open Library suggestion, or local photo.
  - Show when a local cover is saved.
  - Consider allowing cover edits from the detail page later.

## Detail Page

- [ ] Make action sections visually clearer
  - Read Status
  - Ownership
  - Metadata
  - Edit Details

- [ ] Add ownership action
  - For Wishlist books: `Add To Library`.
  - For Owned books: `Move To Wishlist`.
  - Update immediately with optimistic UI and rollback on failure.

- [ ] Improve back navigation
  - Return to the page the user came from when possible.
  - Example: Wishlist detail should go back to Wishlist, not always Library.

- [ ] Add a compact metadata summary
  - Format
  - Pages
  - Genre
  - Series
  - ISBN

## Mobile UX

- [ ] Add bottom navigation for phone layouts
  - Keep tap targets at least 44px.
  - Avoid overlap with the floating add button.

- [ ] Audit mobile filter layout
  - Make filter panels compact but not cramped.
  - Consider collapsible filters on small screens.

- [ ] Improve touch targets on cards
  - Ensure card click area is large.
  - Keep action buttons separated enough to avoid accidental taps.

- [ ] Test common mobile workflows
  - Add a wishlist book.
  - Move a wishlist book to library.
  - Mark a book read by Dane/Emma.
  - Edit title/author/cover.

## Search And Discovery

- [ ] Add ISBN/barcode support later
  - Allow searching by ISBN.
  - Consider camera barcode scan for phones.

- [ ] Add better global search later
  - Search across Library and Wishlist.
  - Show ownership status in results.

- [ ] Add series browsing
  - Group by series.
  - Sort books within series by series order.

- [ ] Add “Recently Added” and “Recently Updated”
  - Useful on both Library and Manage.

## Visual Polish

- [ ] Continue refining the warm palette
  - Keep parchment, cream, sage, brass, and warm-gray consistent.
  - Avoid cool gray/white surfaces that clash with the tan background.

- [ ] Standardize filter panels
  - Library, Wishlist, and Manage should use the same compact rhythm.
  - Keep labels visible and accessible.

- [ ] Refine book cards after real use
  - Confirm XS/Small/Medium/Large are all useful.
  - Remove a size option if the control feels too busy.

- [ ] Add stronger focus states to cards
  - Make keyboard navigation obvious.
  - Ensure focus rings are not clipped by card overflow.

- [ ] Improve thumbnail fallback art
  - Replace text-only fallback with a simple book icon or styled placeholder.
  - Keep it lightweight and consistent.

## Data And Sync

- [ ] Confirm ownership changes sync correctly
  - Wishlist to Library
  - Library to Wishlist
  - Add new book with correct ownership

- [ ] Add optimistic UI rollback messages
  - Move ownership failed
  - Read-status save failed
  - Delete failed

- [ ] Consider a sync status indicator in the shell
  - Keep it subtle.
  - Show offline/sync error states when relevant.

## Nice-To-Have

- [ ] Add tags beyond genre
  - Example: “Borrowed”, “Gift”, “Favorite”, “Signed”.

- [ ] Add loan tracking
  - Who borrowed it
  - Date lent
  - Returned status

- [ ] Add reading priority for Wishlist
  - High / Medium / Low
  - Useful for shopping or gift planning.

- [ ] Add export/import affordance in Manage
  - Keep advanced data actions away from daily browsing.

- [ ] Add lightweight onboarding
  - Only for empty library state.
  - Avoid a marketing-style landing page.
