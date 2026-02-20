"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { FileText, Lock, Upload, X } from "lucide-react"

export function UploadCard() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File | null) => {
    if (file && file.type === "application/pdf") {
      setFileName(file.name)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      handleFile(file)
    },
    [handleFile]
  )

  const handleClear = useCallback(() => {
    setFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <section id="upload" className="mx-auto max-w-6xl px-6 pb-24 pt-12">
      <div className="mx-auto max-w-xl">
        <span className="mb-2 block text-center text-xs font-semibold uppercase tracking-widest text-[#8a6b6b]">
          Get started
        </span>
        <Card className="relative border-border/50 bg-card shadow-md ring-1 ring-border/30 transition-all hover:shadow-xl hover:shadow-black/20 hover:ring-primary/10">
          <CardHeader className="space-y-2 pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="font-serif text-xl tracking-tight text-foreground md:text-2xl">
                Upload a document
              </CardTitle>
              <Lock className="size-4 shrink-0 text-[#8a6b6b]" aria-hidden />
            </div>
            <CardDescription className="text-[#8a6b6b]">
              We accept PDF files of loan agreements, credit contracts, and more.
              Your file is processed securely and never stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload a PDF file by dragging and dropping or clicking to browse"
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 transition-all duration-200 ${
                isDragOver
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/80 bg-muted/30 hover:border-foreground/15 hover:bg-muted/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/50">
                <Upload className="size-5 text-[#8a6b6b]" />
              </div>
              <span className="block text-sm font-medium text-foreground">
                Drag & drop your PDF or click to browse
              </span>
              <span className="mt-1.5 block text-xs text-[#8a6b6b]">
                PDF up to 10MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={handleChange}
                aria-hidden="true"
              />
            </div>

            {fileName && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                <FileText className="size-4 shrink-0 text-[#8a6b6b]" />
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {fileName}
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-md p-1.5 text-[#8a6b6b] transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Remove selected file"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-lg font-medium border-border bg-card/50 transition-transform hover:scale-[0.98] active:scale-[0.96] active:translate-y-px"
                onClick={handleClear}
                disabled={!fileName}
              >
                Clear
              </Button>
              <Button
                className="flex-1 rounded-lg transition-transform hover:scale-[0.98] active:scale-[0.96] active:translate-y-px"
                disabled={!fileName}
              >
                Analyze
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
