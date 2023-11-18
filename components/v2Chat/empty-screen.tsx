import { Badge } from './ui/badge';

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <div className="flex align-middle mb-1">
          <h1 className="text-lg font-semibold">
            Welcome to Chat Everywhere v2
          </h1>
          <Badge variant={"outline"} className="ml-2">Beta</Badge>
        </div>
        <p className="mb-2 leading-normal text-muted-foreground">
          This will be the new chat interface for Chat Everywhere. We are working on adding more features on the upcoming weeks.<br/>
        </p>
      </div>
    </div>
  );
}
