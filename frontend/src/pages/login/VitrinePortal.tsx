import rabiscos from '../../assets/rabiscos.svg'

/**
 * Painel da tela de login (só em telas grandes): o significado do nome no alto,
 * com a mesma margem do logo do outro lado, rabiscos no meio e uma frase em latim no pé.
 * O fundo verde cobre a coluna inteira; só o conteúdo fica grudado na tela ao rolar.
 */
export function VitrinePortal() {
  return (
    <aside className="hidden bg-[#173f32] text-[#f1ede3] lg:block" aria-hidden>
      <div className="sticky top-0 flex h-dvh max-h-full flex-col justify-between px-10 py-8">
        <div className="rise-in max-w-[520px] [animation-delay:80ms]">
          <p className="font-serif text-[64px] font-semibold leading-none tracking-[-0.02em] xl:text-[76px]">
            Discipulus
          </p>
          <p className="mt-4 font-serif text-[17px] italic text-[#f1ede3]/70">
            dis·cí·pu·lus <span className="not-italic text-[#f1ede3]/45">— latim, substantivo masculino</span>
          </p>
          <p className="mt-5 max-w-[44ch] border-l-2 border-[#d9a54a] pl-4 text-[16px] leading-relaxed text-[#f1ede3]/85">
            Aquele que aprende. Aqui o aluno acompanha notas e histórico, e a secretaria e os
            professores cuidam de cadastros e lançamentos.
          </p>
        </div>

        {/* Rabiscos de caderno: crianças estudando */}
        <div className="rise-in relative my-6 min-h-0 w-full max-w-[520px] flex-1 [animation-delay:120ms]">
          {/* Preenche o espaço do meio e encolhe em telas baixas */}
          <img src={rabiscos} alt="" className="absolute inset-0 h-full w-full object-contain" />
        </div>

        <figure className="rise-in max-w-[520px] border-t border-[#f1ede3]/15 pt-6 [animation-delay:160ms]">
          <blockquote className="font-serif text-[28px] italic leading-snug text-[#f1ede3]/90 xl:text-[32px]">
            Non scholae, sed vitae discimus.
          </blockquote>
          <figcaption className="mt-3 text-[14px] text-[#f1ede3]/55">
            “Não aprendemos para a escola, mas para a vida.”
          </figcaption>
        </figure>
      </div>
    </aside>
  )
}
