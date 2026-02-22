export default function Loading() {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-pulse-subtle text-primary"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              fill="currentColor"
            />
            <path
              d="M12.5 12.5H17v-1h-4.5V7H11v5.5H7v1h4V17h1.5v-4.5z"
              fill="currentColor"
            />
          </svg>
          <p className="text-lg font-medium text-muted-foreground">
            EMPLOYEE APP is loading...
          </p>
        </div>
      </div>
    )
  }
