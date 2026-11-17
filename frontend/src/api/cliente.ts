import { useAuth } from '../auth/store'

/** Erro devolvido pela API, com a mensagem pronta para mostrar ao usuário. */
export class ErroApi extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Chama a API (/api/...) com o token do usuário logado. */
export async function requisitar<T = void>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const token = useAuth.getState().token
  let res: Response
  try {
    res = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: {
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar ao servidor.')
  }

  if (res.status === 401 && token) {
    // Token expirou: encerra a sessão e o app volta para o login
    useAuth.getState().sair()
    throw new ErroApi(401, 'Sua sessão expirou. Entre novamente.')
  }

  const dados = res.status === 204 ? undefined : await res.json().catch(() => undefined)
  if (!res.ok) throw new ErroApi(res.status, (dados as { erro?: string })?.erro ?? `Erro ${res.status}`)
  return dados as T
}

export const mensagemDe = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado.')
