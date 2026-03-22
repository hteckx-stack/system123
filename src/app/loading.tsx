export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background/50 backdrop-blur-sm fixed inset-0 z-50">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Syncing Live Data...</p>
      </div>
    </div>
  )
}
