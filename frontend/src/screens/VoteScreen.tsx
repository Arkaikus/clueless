import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePeer } from '@/hooks/usePeer'
import { Button } from '@/components/Button'
import { PlayerBadge } from '@/components/PlayerBadge'

export function VoteScreen() {
  const [selected, setSelected] = useState<string | null>(null)
  const players = useGameStore((s) => s.players)
  const myPeerId = useGameStore((s) => s.myPeerId)
  const round = useGameStore((s) => s.round)
  const { submitVote } = usePeer()

  if (!round) return null
  const candidates = players.filter((p) => p.id !== myPeerId)

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg">
        <h1 className="text-center mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>Who seems clueless?</h1>
        <p className="text-center mb-8" style={{ color: 'var(--color-text-muted)' }}>Tap a player card to cast your vote.</p>
        <div className="grid gap-3 mb-6">
          {candidates.map((player) => (
            <button key={player.id} onClick={() => setSelected(player.id)} className="rounded-2xl p-4 text-left transition-all duration-200"
              style={{ background: selected === player.id ? 'var(--color-surface-3)' : 'var(--color-surface)', border: selected === player.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)' }}>
              <PlayerBadge player={player} size="lg" />
            </button>
          ))}
        </div>
        <Button size="lg" className="w-full" disabled={!selected} onClick={() => selected && submitVote(selected)}>Cast Vote</Button>
      </div>
    </div>
  )
}
