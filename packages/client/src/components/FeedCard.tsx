import { NoteCard } from './NoteCard'
import type { FeedEntry } from '../lib/api'

interface FeedCardProps {
  entry: FeedEntry
}

export function FeedCard({ entry }: FeedCardProps) {
  return (
    <NoteCard
      id={entry.id}
      title={entry.title}
      content={entry.content}
      visibility={entry.visibility}
      published={entry.published}
      author={{
        username: entry.author.username,
        displayName: entry.author.displayName,
        isLocal: entry.author.isLocal,
        isOwnPost: entry.author.isOwnPost
      }}
      showAuthor={true}
      showVisibilityBadge={true}
    />
  )
}
