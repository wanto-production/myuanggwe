import { client } from "./eden"

export type LayoutData = Awaited<ReturnType<typeof client.layout.get>>['data']
