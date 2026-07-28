import { Timestamp } from 'firebase/firestore'

const now = new Date()
const dias = (n) => new Date(now - n * 86400000)

export const MOCK_DESAFIOS = [
  {
    id: 'desafio-1',
    titulo: '🏋️ Treinar',
    participantes: ['user-demo', 'rival-demo'],
    criado_por: 'user-demo',
    aceitos: ['user-demo', 'rival-demo'],
    status: 'ativo',
    streak_atual_por_usuario: { 'user-demo': 12, 'rival-demo': 8 },
    duracao_dias: 30,
    aposta: 'Quem perder paga o lanche',
    criado_em: { toDate: () => dias(15) },
  },
  {
    id: 'desafio-2',
    titulo: '📚 Estudar inglês',
    participantes: ['user-demo', 'rival-demo'],
    criado_por: 'rival-demo',
    aceitos: ['user-demo', 'rival-demo'],
    status: 'ativo',
    streak_atual_por_usuario: { 'user-demo': 5, 'rival-demo': 7 },
    duracao_dias: 30,
    aposta: null,
    criado_em: { toDate: () => dias(10) },
  },
  {
    id: 'desafio-3',
    titulo: '🧘 Meditar',
    participantes: ['user-demo', 'rival-demo'],
    criado_por: 'user-demo',
    aceitos: ['user-demo'],
    status: 'pendente',
    streak_atual_por_usuario: {},
    duracao_dias: 21,
    aposta: null,
    criado_em: { toDate: () => dias(1) },
  },
]

export const MOCK_CHECKINS = [
  {
    id: 'ci-1',
    userId: 'rival-demo',
    foto_url: null,
    horario_inicio: dias(0).toISOString(),
    horario_fim: dias(0).toISOString(),
    duracao_minutos: 45,
    status: 'pendente',
    criado_em: { toDate: () => dias(0) },
  },
  {
    id: 'ci-2',
    userId: 'user-demo',
    foto_url: null,
    horario_inicio: dias(1).toISOString(),
    horario_fim: dias(1).toISOString(),
    duracao_minutos: 60,
    status: 'aprovado',
    avaliado_por: 'rival-demo',
    criado_em: { toDate: () => dias(1) },
  },
  {
    id: 'ci-3',
    userId: 'rival-demo',
    foto_url: null,
    horario_inicio: dias(2).toISOString(),
    horario_fim: dias(2).toISOString(),
    duracao_minutos: 30,
    status: 'reprovado',
    avaliado_por: 'user-demo',
    motivo_reprovacao: 'Foto muito escura, não deu pra confirmar',
    criado_em: { toDate: () => dias(2) },
  },
  {
    id: 'ci-4',
    userId: 'user-demo',
    foto_url: null,
    horario_inicio: dias(2).toISOString(),
    horario_fim: dias(2).toISOString(),
    duracao_minutos: 55,
    status: 'aprovado',
    avaliado_por: 'rival-demo',
    criado_em: { toDate: () => dias(2) },
  },
]

export const MOCK_RIVAL = {
  id: 'rival-demo',
  nome: 'Pedro Rival',
  email: 'pedro@strike.com',
  foto_perfil: null,
  streak_atual: 8,
  total_checkins: 31,
  taxa_aprovacao: 87,
}
