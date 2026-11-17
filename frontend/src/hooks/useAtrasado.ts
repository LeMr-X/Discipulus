import { useEffect, useState } from 'react'

/** Devolve o valor só depois que ele para de mudar por `ms` (ex.: busca enquanto digita). */
export function useAtrasado<T>(valor: T, ms = 200) {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return atrasado
}
