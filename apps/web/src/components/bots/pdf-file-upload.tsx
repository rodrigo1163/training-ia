import { useState } from 'react'
import {
  AlertCircleIcon,
  FileTextIcon,
  FileUpIcon,
  Loader2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload'
import { usePdfUpload } from '@/hooks/use-pdf-upload'

const MAX_FILES = 10
const MAX_SIZE = 10 * 1024 * 1024

export function PdfFileUpload({
  organizationId,
  botId,
}: {
  organizationId: string
  botId: string
}) {
  const [open, setOpen] = useState(false)
  const { items, isUploading, startUpload, cancel, clear } = usePdfUpload(
    organizationId,
    botId,
  )

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    accept: 'application/pdf,.pdf',
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE,
    multiple: true,
  })

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isUploading) {
      return
    }
    setOpen(nextOpen)
    if (!nextOpen) {
      clearFiles()
      clear()
    }
  }

  async function handleSubmit() {
    const pdfFiles = files.flatMap((item) =>
      item.file instanceof File ? [item.file] : [],
    )

    if (pdfFiles.length === 0) {
      return
    }

    const result = await startUpload(pdfFiles)

    if (result.errorCount === 0) {
      toast.add({ title: 'PDFs enviados', type: 'success' })
      handleOpenChange(false)
    } else {
      toast.add({
        title: 'Alguns arquivos falharam no envio.',
        type: 'error',
      })
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <UploadIcon className="size-4 opacity-60" />
          Adicionar PDFs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar PDFs</DialogTitle>
          <DialogDescription>
            Os arquivos vão direto para o armazenamento e entram na fila de
            processamento.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          <div className="flex flex-col gap-2">
            <div
              className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-input p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-disabled:opacity-50 data-[dragging=true]:bg-accent/50"
              data-dragging={isDragging || undefined}
              onClick={openFileDialog}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              role="button"
              tabIndex={-1}
            >
              <input
                {...getInputProps()}
                aria-label="Adicionar PDFs"
                className="sr-only"
              />

              <div className="flex flex-col items-center justify-center text-center">
                <div
                  aria-hidden="true"
                  className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
                >
                  <FileUpIcon className="size-4 opacity-60" />
                </div>
                <p className="mb-1.5 text-sm font-medium">Adicionar PDFs</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Arraste ou clique para selecionar
                </p>
                <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
                  <span>Apenas PDF</span>
                  <span>∙</span>
                  <span>Máx. {MAX_FILES} arquivos</span>
                  <span>∙</span>
                  <span>Até {formatBytes(MAX_SIZE)}</span>
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div
                className="flex items-center gap-1 text-xs text-destructive"
                role="alert"
              >
                <AlertCircleIcon className="size-3 shrink-0" />
                <span>{errors[0]}</span>
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => {
                  const name =
                    file.file instanceof File ? file.file.name : file.file.name
                  const size =
                    file.file instanceof File ? file.file.size : file.file.size
                  const upload = items.find(
                    (item) => item.file.name === name && item.file.size === size,
                  )

                  return (
                    <div
                      className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3"
                      key={file.id}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                          <FileTextIcon className="size-4 opacity-60" />
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="truncate text-[13px] font-medium">
                            {name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(size)}
                            {upload
                              ? ` · ${upload.status}${
                                  upload.status === 'uploading'
                                    ? ` ${upload.progress}%`
                                    : ''
                                }`
                              : ''}
                          </p>
                          {upload?.error ? (
                            <p className="text-xs text-destructive">
                              {upload.error}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {!isUploading ? (
                        <Button
                          aria-label={`Remover ${name}`}
                          className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                          onClick={() => removeFile(file.id)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <XIcon aria-hidden="true" className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  )
                })}

                {files.length > 1 && !isUploading ? (
                  <div>
                    <Button
                      onClick={clearFiles}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Remover todos
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {isUploading ? (
            <Button onClick={cancel} type="button" variant="outline">
              Cancelar
            </Button>
          ) : null}
          <Button
            disabled={files.length === 0 || isUploading}
            onClick={() => {
              void handleSubmit()
            }}
            type="button"
          >
            {isUploading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
