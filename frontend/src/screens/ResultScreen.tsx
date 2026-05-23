import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'

export function ResultScreen() {
  const round = useGameStore((s) => s.round)
  const players = useGameStore((s) => s.players)
  const scores = useGameStore((s) => s.scores)
  const setPhase = useGameStore((s) => s.setPhase)

  useEffect(() => {
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } })
  }, [])

  if (!round) return null
  const clueless = players.find((p) => p.id === round.cluelessId)

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg flex flex-col gap-6">
        <Card glow="var(--player-pink)">
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Round result</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 8 }}>The clueless one was...</h1>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: 'var(--player-pink)' }}>{clueless?.nickname ?? 'Unknown'}</div>
          <p className="mt-3" style={{ color: 'var(--color-text-muted)' }}>Secret word: <strong style={{ color: 'var(--color-text)' }}>{round.secretWord}</strong></p>
        </Card>
        <Card>
          <h2 className="mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)' }}>Scoreboard</h2>
          <div className="flex flex-col gap-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--color-surface-2)' }}>
                <span>{player.nickname}</span>
                <strong>{scores[player.id] ?? 0}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Button size="lg" className="w-full" onClick={() => setPhase('lobby')}>Back to Lobby</Button>
      </div>
    </div>
  )
}
