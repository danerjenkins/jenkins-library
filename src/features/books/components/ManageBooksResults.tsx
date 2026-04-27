import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
import type { Book } from "../bookTypes";
import type { ReactNode } from "react";
import { ManageBookRow } from "./ManageBookRow";

function ManageBooksState({ children }: { children: ReactNode }) {
  return (
    <div className="ds-panel-surface border-dashed border-warm-gray bg-parchment/75 px-4 py-12 text-center text-sm text-stone-600">
      {children}
    </div>
  );
}

export function ManageBooksResults({
  loading,
  books,
  filteredBooks,
  filterOwnership,
  onStartAddBook,
  onClearFilters,
  onEdit,
  onDelete,
  onToggleOwnership,
  ownershipBusyId,
}: {
  loading: boolean;
  books: Book[];
  filteredBooks: Book[];
  filterOwnership: "owned" | "wishlist";
  onStartAddBook: (ownership?: "owned" | "wishlist") => void;
  onClearFilters: () => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onToggleOwnership: (book: Book) => void;
  ownershipBusyId: string | null;
}) {
  if (loading) {
    return (
      <LoadingState
        title="Loading Books"
        description="Building the management table and ownership controls."
        variant="panel"
      />
    );
  }

  if (books.length === 0) {
    return (
      <ManageBooksState>
        <p className="font-medium">No books yet</p>
        <p className="mt-1 text-xs text-stone-500">
          {filterOwnership === "wishlist"
            ? "Add a wishlist book to start tracking what you want."
            : "Add your first book to start managing the library."}
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={() => onStartAddBook(filterOwnership)}
          className="mt-4"
        >
          {filterOwnership === "wishlist" ? "Add Wishlist Book" : "Add Book"}
        </Button>
      </ManageBooksState>
    );
  }

  if (filteredBooks.length === 0) {
    return (
      <ManageBooksState>
        <p className="font-medium">No matches found</p>
        <p className="mt-1 text-xs text-stone-500">Adjust search or filters to see more books.</p>
        <p className="mt-2">
          <Button type="button" variant="secondary" onClick={onClearFilters} className="text-xs">
            Clear Filters
          </Button>
        </p>
      </ManageBooksState>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Manage books">
      {filteredBooks.map((book) => (
        <div key={book.id} role="listitem">
          <ManageBookRow
            book={book}
            ownershipBusy={ownershipBusyId === book.id}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleOwnership={onToggleOwnership}
          />
        </div>
      ))}
    </div>
  );
}
