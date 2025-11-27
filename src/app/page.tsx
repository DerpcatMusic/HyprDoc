import { HyprEditor } from '@/components/editor/HyprEditor';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">HyprDoc</h1>
          <p className="text-zinc-500 mt-2">Next-Gen Document Signing Platform</p>
        </header>
        
        <section>
          <HyprEditor />
        </section>
      </div>
    </main>
  );
}
