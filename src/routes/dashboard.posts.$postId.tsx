import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { Spinner } from './-components/spinner'

export const Route = createFileRoute('/dashboard/posts/$postId')({
  validateSearch: z.object({
    showNotes: z.boolean().optional(),
    notes: z.string().optional(),
  }),
  loader: async ({ context: { queryClient }, params: { postId } }) => {
    await queryClient.ensureQueryData({
      queryKey: ['posts', 'byId', { id: postId }],
      queryFn: () => trpc.posts.byId.query({ id: postId }),
    })
  },
  pendingComponent: Spinner,
  component: PostComponent,
})

function PostComponent() {
  const { postId } = Route.useParams()
  const postQuery = trpc.posts.byId.useQuery({ id: postId })

  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const [notes, setNotes] = React.useState(search.notes ?? ``)

  React.useEffect(() => {
    navigate({
      search: (old) => ({ ...old, notes: notes ? notes : undefined }),
      replace: true,
      params: true,
    })
  }, [notes])

  if (postQuery.isLoading) {
    return <div>Loading post...</div>
  }

  if (postQuery.error) {
    return <div>Error: {postQuery.error.message}</div>
  }

  return (
    <div className="p-2 space-y-2" key={postQuery.data?.id}>
      <div className="space-y-2">
        <h2 className="font-bold text-lg">
          <input
            defaultValue={postQuery.data?.id}
            className="border border-opacity-50 rounded p-2 w-full"
            disabled
          />
        </h2>
        <div>
          <textarea
            defaultValue={postQuery.data?.title}
            rows={6}
            className="border border-opacity-50 p-2 rounded w-full"
            disabled
          />
        </div>
      </div>
      <div>
        <Link
          from={Route.fullPath}
          search={(old) => ({
            ...old,
            showNotes: old.showNotes ? undefined : true,
          })}
          params={true}
          className="text-blue-700"
        >
          {search.showNotes ? 'Close Notes' : 'Show Notes'}{' '}
        </Link>
        {search.showNotes ? (
          <>
            <div>
              <div className="h-2" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="shadow w-full p-2 rounded"
                placeholder="Write some notes here..."
              />
              <div className="italic text-xs">
                Notes are stored in the URL. Try copying the URL into a new tab!
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
