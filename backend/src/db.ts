import mysql from 'mysql2/promise'
import type { Config } from './config.js'

export function criarPool(config: Config['db']) {
  return mysql.createPool({
    ...config,
    connectionLimit: 10,
    // Datas como texto (evita conversão de fuso) e DECIMAL como número
    dateStrings: true,
    decimalNumbers: true,
  })
}

export type Pool = ReturnType<typeof criarPool>

/** "2026-02-10 09:12:00" (MySQL) -> "2026-02-10T09:12:00" (ISO, hora local) */
export const paraIso = (valor: string) => valor.replace(' ', 'T')
