import { createFileRoute } from '@tanstack/react-router'
import {
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  SaveIcon,
  SettingsIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react'

import { Checkbox } from '@/components/animate-ui/components/base/checkbox'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@/components/animate-ui/components/base/dialog'
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPanel,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger,
} from '@/components/animate-ui/components/base/menu'
import {
  Popover,
  PopoverDescription,
  PopoverPanel,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/animate-ui/components/base/popover'
import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from '@/components/animate-ui/components/base/progress'
import { Switch } from '@/components/animate-ui/components/base/switch'
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsPanels,
  TabsTab,
} from '@/components/animate-ui/components/base/tabs'
import {
  Tooltip,
  TooltipPanel,
  TooltipTrigger,
} from '@/components/animate-ui/components/base/tooltip'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { IconButton } from '@/components/animate-ui/components/buttons/icon'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-3 border-b pb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <SparklesIcon className="size-4" />
          Animate UI
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground">
              Componentes essenciais
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Uma pagina de referencia com os componentes baixados do registry.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <DownloadIcon />
              Exportar
            </Button>
            <Button>
              <SaveIcon />
              Salvar
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title="Buttons">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">
                <Trash2Icon />
                Delete
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <IconButton aria-label="Notifications" variant="outline">
                <BellIcon />
              </IconButton>
              <IconButton aria-label="Settings">
                <SettingsIcon />
              </IconButton>
              <IconButton aria-label="More actions" variant="ghost">
                <MoreHorizontalIcon />
              </IconButton>
            </div>
          </Panel>

          <Panel title="Dialog">
            <Dialog>
              <DialogTrigger nativeButton render={<Button>Abrir dialog</Button>} />
              <DialogPopup>
                <DialogHeader>
                  <DialogTitle>Confirmar treinamento</DialogTitle>
                  <DialogDescription>
                    Este dialog usa as animacoes e primitives do Animate UI.
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  Revisar conteudo, confirmar participantes e publicar.
                </div>
                <DialogFooter>
                  <DialogClose
                    nativeButton
                    render={<Button variant="outline">Cancelar</Button>}
                  />
                  <DialogClose nativeButton render={<Button>Confirmar</Button>} />
                </DialogFooter>
              </DialogPopup>
            </Dialog>
          </Panel>

          <Panel title="Menu">
            <Menu>
              <MenuTrigger
                nativeButton
                render={
                  <Button variant="outline">
                    Acoes
                    <ChevronDownIcon />
                  </Button>
                }
              />
              <MenuPanel>
                <MenuGroup>
                  <MenuGroupLabel>Workspace</MenuGroupLabel>
                  <MenuItem>
                    <SaveIcon />
                    Salvar rascunho
                    <MenuShortcut>⌘S</MenuShortcut>
                  </MenuItem>
                  <MenuItem>
                    <DownloadIcon />
                    Exportar
                  </MenuItem>
                  <MenuCheckboxItem checked>Notificacoes</MenuCheckboxItem>
                </MenuGroup>
                <MenuSeparator />
                <MenuItem variant="destructive">
                  <Trash2Icon />
                  Remover
                </MenuItem>
              </MenuPanel>
            </Menu>
          </Panel>

          <Panel title="Popover">
            <Popover>
              <PopoverTrigger
                nativeButton
                render={<Button variant="outline">Ver detalhes</Button>}
              />
              <PopoverPanel>
                <PopoverTitle className="font-medium">Status da turma</PopoverTitle>
                <PopoverDescription className="mt-1 text-sm text-muted-foreground">
                  18 alunos ativos, 4 aulas publicadas e progresso medio de 72%.
                </PopoverDescription>
              </PopoverPanel>
            </Popover>
          </Panel>

          <Panel title="Form controls">
            <label className="flex items-center gap-3 text-sm">
              <Checkbox nativeButton defaultChecked />
              Certificado habilitado
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Switch nativeButton defaultChecked />
              Publicar automaticamente
            </label>
          </Panel>

          <Panel title="Tooltip">
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground">
                    Passe o mouse
                    <SparklesIcon />
                  </span>
                }
              />
              <TooltipPanel>Tooltip animado pronto para uso.</TooltipPanel>
            </Tooltip>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Tabs">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTab value="overview">Resumo</TabsTab>
                <TabsTab value="lessons">Aulas</TabsTab>
                <TabsTab value="people">Pessoas</TabsTab>
              </TabsList>
              <TabsPanels className="rounded-md border p-4">
                <TabsPanel value="overview">
                  <Metric label="Conclusao" value="72%" />
                </TabsPanel>
                <TabsPanel value="lessons">
                  <Metric label="Aulas publicadas" value="4" />
                </TabsPanel>
                <TabsPanel value="people">
                  <Metric label="Alunos ativos" value="18" />
                </TabsPanel>
              </TabsPanels>
            </Tabs>
          </Panel>

          <Panel title="Progress">
            <Progress value={72}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <ProgressLabel>Progresso geral</ProgressLabel>
                <ProgressValue />
              </div>
              <ProgressTrack />
            </Progress>
          </Panel>

          <Panel title="Checklist">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                Button, IconButton e Menu
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                Dialog, Popover e Tooltip
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                Tabs, Checkbox, Switch e Progress
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </main>
  )
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <section className="flex min-h-36 flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="flex flex-1 flex-col justify-center gap-4">{children}</div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <strong className="text-2xl font-semibold">{value}</strong>
    </div>
  )
}
