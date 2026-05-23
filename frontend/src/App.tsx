import { useGameStore } from '@/store/gameStore'
import { HomeScreen } from '@/screens/HomeScreen'
import { LobbyScreen } from '@/screens/LobbyScreen'
import { RoleRevealScreen } from '@/screens/RoleRevealScreen'
import { ClueScreen } from '@/screens/ClueScreen'
import { VoteScreen } from '@/screens/VoteScreen'
import { ResultScreen } from '@/screens/ResultScreen'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const players = useGameStore((s) => s.players)

  if (players.length === 0) return <HomeScreen />
  if (phase === 'lobby') return <LobbyScreen />
  if (phase === 'role-reveal') return <RoleRevealScreen />
  if (phase === 'clue') return <ClueScreen />
  if (phase === 'vote') return <VoteScreen />
  if (phase === 'result') return <ResultScreen />

  return <HomeScreen />
}
