import type { ReactNode } from "react";
import { Input } from "../../../ui/components/Input";
import { Button } from "../../../ui/components/Button";

interface BookFormProps {
  isEditing: boolean;
  title: string;
  author: string;
  genre: string;
  finished: boolean;
  onTitleChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onFinishedChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function BookForm({
  isEditing,
  title,
  author,
  genre,
  finished,
  onTitleChange,
  onAuthorChange,
  onGenreChange,
  onFinishedChange,
  onSubmit,
  onCancel,
  children,
}: BookFormProps) {
  return (
    <form
      className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
      onSubmit={onSubmit}
    >
      {children && (
        <div className="mb-2 text-sm font-medium text-stone-600">
          {children}
        </div>
      )}

      <Input
        id="title"
        label="Title"
        type="text"
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onTitleChange(e.target.value)
        }
        placeholder="Enter book title"
        autoFocus
      />

      <Input
        id="author"
        label="Author"
        type="text"
        value={author}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onAuthorChange(e.target.value)
        }
        placeholder="Enter author name"
      />

      <Input
        id="genre"
        label="Genre (optional)"
        type="text"
        value={genre}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onGenreChange(e.target.value)
        }
        placeholder="e.g., Fiction, Non-fiction, Mystery"
      />

      <div className="flex items-center gap-2">
        <input
          id="finished"
          type="checkbox"
          checked={finished}
          onChange={(e) => onFinishedChange(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200"
        />
        <label
          htmlFor="finished"
          className="text-sm font-medium text-stone-700"
        >
          I've finished reading this book
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          variant="success"
          disabled={!title.trim() || !author.trim()}
        >
          {isEditing ? "Update Book" : "Add Book"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
