export type Scene = {
  n: number
  start: string
  end: string
  title: string
  on_screen: string
  voiceover: string
  user_input?: string | string[]
}

export type OptionalScene = {
  insert_after: number
  duration_seconds: number
  title: string
  on_screen: string
  voiceover: string
  user_input?: string
}

export type DemoScript = {
  id: string
  title: string
  audience: string[]
  duration_seconds: number
  device: string
  scenes: Scene[]
  optional_scenes?: OptionalScene[]
}

export type DemoProps = {
  project: string
  site: string
  repo: string
  version: string
  scripts: DemoScript[]
}
