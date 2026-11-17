import { useCallback, useEffect, useRef, useState } from 'react'
import { mensagemDe } from '../api/cliente'

/**
 * Carrega dados de uma função assíncrona e recarrega quando `deps` mudam.
 * Ignora respostas antigas (quando o usuário troca de filtro rápido).
 */
export function useCarregar<T>(carregar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const versao = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fn = useCallback(carregar, deps)

  const recarregar = useCallback(async () => {
    const minha = ++versao.current
    setCarregando(true)
    try {
      const r = await fn()
      if (minha === versao.current) {
        setDados(r)
        setErro(null)
      }
    } catch (e) {
      if (minha === versao.current) setErro(mensagemDe(e))
    } finally {
      if (minha === versao.current) setCarregando(false)
    }
  }, [fn])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { dados, erro, carregando, recarregar, setDados }
}
