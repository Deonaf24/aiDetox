'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone"
import { useState } from "react";

export default function Chat() {

  const [files, setFiles] = useState<File[] | undefined>();

  const handleDrop = (files: File[]) => {
    console.log(files);
    setFiles(files);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link href="/" className="font-semibold">stopllms</Link>
          <Button asChild variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto grid gap-6 px-4 py-6 md:grid-cols-2">
        {/* Left: Dropzones */}
        <section className="space-y-4">
          {/* Dropzone 1: Assignment upload */}
          <Dropzone
            maxSize={1024 * 1024 * 30}
            minSize={1024}
            onDrop={handleDrop}
            onError={console.error}
            src={files}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
          {/* Dropzone 2: Answer sheet */}
          <Dropzone
            maxSize={1024 * 1024 * 30}
            minSize={1024}
            onDrop={handleDrop}
            onError={console.error}
            src={files}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </section>

        {/* Right: Chat */}
        <section className="flex flex-col rounded-xl border">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 300 }}>
            {/* message bubbles will go here */}
            <div className="text-sm text-muted-foreground">No messages yet.</div>
          </div>
          <Separator />
          {/* Input row */}
          <form className="p-3 flex gap-2">
            <input
              className="flex-1 border rounded-md px-3 py-2 text-sm outline-none"
              placeholder="Ask something…"
            />
            <Button type="submit">Send</Button>
          </form>
        </section>
      </main>
    </div>
  );
}
