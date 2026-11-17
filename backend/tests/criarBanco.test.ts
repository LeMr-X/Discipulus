import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { dividirComandos } from '../scripts/criarBanco.js'

describe('dividirComandos (npm run banco)', () => {
  it('separa comandos por ponto e vírgula e ignora comentários', () => {
    expect(dividirComandos('-- comentário\nUSE x;\n\nSELECT 1;\n')).toEqual(['USE x', 'SELECT 1'])
  })

  it('respeita DELIMITER $$ nas triggers', () => {
    const sql = 'DELIMITER $$\nCREATE TRIGGER t BEFORE INSERT ON a FOR EACH ROW\nBEGIN\n  SET NEW.x = 1;\nEND$$\nDELIMITER ;\nSELECT 2;'
    const comandos = dividirComandos(sql)
    expect(comandos).toHaveLength(2)
    expect(comandos[0]).toContain('SET NEW.x = 1;')
    expect(comandos[0].endsWith('END')).toBe(true)
    expect(comandos[1]).toBe('SELECT 2')
  })

  it('entende comentário no fim da linha depois do ponto e vírgula', () => {
    expect(dividirComandos("INSERT INTO a VALUES (1);   -- inativo\nSELECT 2;")).toEqual(['INSERT INTO a VALUES (1);', 'SELECT 2'].map((c) => c.replace(/;$/, '')))
  })

  it('lê os scripts reais do projeto', () => {
    expect(dividirComandos(readFileSync('../database/03_dados.sql', 'utf8')).filter((c) => c.startsWith('CALL'))).toHaveLength(6)
    const regras = dividirComandos(readFileSync('../database/02_regras.sql', 'utf8'))
    // USE + 5 triggers + 1 procedure + 2 views
    expect(regras).toHaveLength(9)
    expect(regras.filter((c) => c.startsWith('CREATE TRIGGER'))).toHaveLength(5)
  })
})
