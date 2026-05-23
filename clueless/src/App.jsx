import { useEffect, useMemo, useState } from 'react'
import './game.css'

const wordBank = [
  'Lantern',
  'Orbit',
  'Mosaic',
  'Harbor',
  'Velvet',
  'Comet',
  'Echo',
  'Garden',
  'Quartz',
  'Signal',
]

const clueBank = [
  'Bright, but not a star.',
  'It moves, but does not walk.',
  'A pattern made of many small pieces.',
  'Shelter for a ship.',
  'Soft enough to touch.',
  'Leaves a trail in the night sky.',
]

const nicknamePool = ['Mira', 'Atlas', 'Jun', 'Nori', 'Sage', 'Ivy', 'Rune', 'Aria']

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 10)
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function createPlayer(nickname, role = 'guest') {
  return {
    id: makeId(),
    nickname,
    role,
  }
}

function seedRoomPlayers(hostName) {
  const host = createPlayer(hostName, 'host')
  const guests = nicknamePool.slice(0, 3).map((name) => createPlayer(name, 'guest'))

  return [host, ...guests]
}

function scoreLabel(score) {
  return score === 1 ? 'point' : 'points'
}

function App() {
  const [phase, setPhase] = useState('home')
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [myPeerId, setMyPeerId] = useState(null)
  const [scores, setScores] = useState({})
  const [round, setRound] = useState(null)
  const [selectedVote, setSelectedVote] = useState(null)
  const [clueText, setClueText] = useState('')
  const [nickname, setNickname] = useState('You')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const activePlayer = useMemo(
    () => players.find((player) => player.id === myPeerId) ?? players[0] ?? null,
    [players, myPeerId],
  )

  const cluelessPlayer = useMemo(
    () => (round ? players.find((player) => player.id === round.cluelessId) ?? null : null),
    [players, round],
  )

  useEffect(() => {
    if (phase !== 'result') {
      return
    }

    const timer = window.setTimeout(() => {
      setStatusMessage('Round finished. Start another one from the lobby.')
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [phase])

  async function createRoom() {
    const trimmedName = nickname.trim() || 'You'
    const roomCode = makeRoomCode()
    const createdPlayers = seedRoomPlayers(trimmedName)
    const hostPeerId = createdPlayers[0].id

    setBusy(true)

    try {
      await fetch('/room', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ code: roomCode, hostPeerId }),
      })

      setRoom({ code: roomCode, hostPeerId })
      setPlayers(createdPlayers)
      setMyPeerId(hostPeerId)
      setScores({})
      setRound(null)
      setSelectedVote(null)
      setClueText('')
      setPhase('lobby')
      setStatusMessage(`Room ${roomCode} is ready.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to create a room.')
    } finally {
      setBusy(false)
    }
  }

  async function joinRoom() {
    const code = roomCodeInput.trim().toUpperCase()

    if (!code) {
      setStatusMessage('Enter a room code first.')
      return
    }

    setBusy(true)

    try {
      const response = await fetch(`/room/${code}`)
      const payload = await response.json()

      if (!payload.exists || !payload.room) {
        setStatusMessage(`Room ${code} was not found.`)
        return
      }

      const guest = createPlayer(nickname.trim() || 'You', 'guest')
      const sharedPlayers = [
        createPlayer('Host', 'host'),
        guest,
        createPlayer('Guest 2', 'guest'),
        createPlayer('Guest 3', 'guest'),
      ]

      setRoom({ code: payload.room.code, hostPeerId: payload.room.hostPeerId })
      setPlayers(sharedPlayers)
      setMyPeerId(guest.id)
      setScores({})
      setRound(null)
      setSelectedVote(null)
      setClueText('')
      setPhase('lobby')
      setStatusMessage(`Joined room ${code}.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to join the room.')
    } finally {
      setBusy(false)
    }
  }

  function startDemo() {
    const host = createPlayer('You', 'host')
    const roster = [
      host,
      createPlayer('Mira', 'guest'),
      createPlayer('Atlas', 'guest'),
      createPlayer('Nori', 'guest'),
    ]

    setRoom({ code: makeRoomCode(), hostPeerId: host.id })
    setPlayers(roster)
    setMyPeerId(host.id)
    setScores({})
    setRound(null)
    setSelectedVote(null)
    setClueText('')
    setPhase('lobby')
    setStatusMessage('Demo room created locally.')
  }

  function addGuest() {
    const nextGuest = createPlayer(pick(nicknamePool), 'guest')
    setPlayers((currentPlayers) => [...currentPlayers, nextGuest])
    setStatusMessage(`${nextGuest.nickname} joined the table.`)
  }

  function startRound() {
    if (players.length < 3) {
      setStatusMessage('Add at least three players before starting a round.')
      return
    }

    const cluelessId = pick(players).id
    const secretWord = pick(wordBank)

    setRound({
      secretWord,
      clue: '',
      cluelessId,
      votes: {},
    })
    setSelectedVote(null)
    setClueText('')
    setPhase('role-reveal')
    setStatusMessage('A new round has started.')
  }

  function continueFromRoleReveal() {
    setPhase('clue')
    setStatusMessage('Share a clue that fits the word without giving it away.')
  }

  function submitClue() {
    if (!round) {
      return
    }

    const finalClue = clueText.trim() || pick(clueBank)

    setRound((currentRound) =>
      currentRound ? { ...currentRound, clue: finalClue } : currentRound,
    )
    setPhase('vote')
    setStatusMessage('Clues are in. Cast your vote.')
  }

  function submitVote() {
    if (!round || !selectedVote) {
      return
    }

    const guessedRight = selectedVote === round.cluelessId
    const scoreTarget = guessedRight ? myPeerId : round.cluelessId

    setScores((currentScores) => ({
      ...currentScores,
      [scoreTarget]: (currentScores[scoreTarget] ?? 0) + 1,
    }))
    setRound((currentRound) =>
      currentRound
        ? {
            ...currentRound,
            votes: {
              ...currentRound.votes,
              [myPeerId]: selectedVote,
            },
          }
        : currentRound,
    )
    setPhase('result')
    setStatusMessage(
      guessedRight
        ? 'Correct. The clueless player was caught.'
        : 'Wrong target. The clueless player slipped away.',
    )
  }

  function resetToLobby() {
    setSelectedVote(null)
    setClueText('')
    setRound(null)
    setPhase('lobby')
    setStatusMessage('Back in the lobby.')
  }

  if (players.length === 0) {
    return (
      <HomeScreen
        nickname={nickname}
        setNickname={setNickname}
        roomCodeInput={roomCodeInput}
        setRoomCodeInput={setRoomCodeInput}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onStartDemo={startDemo}
        busy={busy}
        statusMessage={statusMessage}
      />
    )
  }

  if (phase === 'lobby') {
    return (
      <LobbyScreen
        room={room}
        players={players}
        myPeerId={myPeerId}
        scores={scores}
        onAddGuest={addGuest}
        onStartRound={startRound}
        onBackToHome={() => {
          setPlayers([])
          setRoom(null)
          setMyPeerId(null)
          setScores({})
          setRound(null)
          setSelectedVote(null)
          setClueText('')
          setPhase('home')
          setStatusMessage('Room cleared.')
        }}
        statusMessage={statusMessage}
      />
    )
  }

  if (phase === 'role-reveal') {
    return (
      <RoleRevealScreen
        player={activePlayer}
        round={round}
        cluelessPlayer={cluelessPlayer}
        onContinue={continueFromRoleReveal}
      />
    )
  }

  if (phase === 'clue') {
    return (
      <ClueScreen
        round={round}
        player={activePlayer}
        clueText={clueText}
        setClueText={setClueText}
        onSubmitClue={submitClue}
      />
    )
  }

  if (phase === 'vote') {
    return (
      <VoteScreen
        players={players}
        myPeerId={myPeerId}
        round={round}
        selectedVote={selectedVote}
        setSelectedVote={setSelectedVote}
        onSubmitVote={submitVote}
      />
    )
  }

  if (phase === 'result') {
    return (
      <ResultScreen
        players={players}
        scores={scores}
        round={round}
        cluelessPlayer={cluelessPlayer}
        onBackToLobby={resetToLobby}
      />
    )
  }

  return null
}

function HomeScreen({
  nickname,
  setNickname,
  roomCodeInput,
  setRoomCodeInput,
  onCreateRoom,
  onJoinRoom,
  onStartDemo,
  busy,
  statusMessage,
}) {
  return (
    <main className="app-shell home-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Social deduction, rebuilt for the browser</p>
          <h1>Clueless</h1>
          <p className="lede">
            One secret word. One clueless player. Everyone else tries to keep the table guessing.
          </p>
        </div>

        <div className="card card-accent intro-card">
          <div className="field-grid">
            <label className="field">
              <span>Nickname</span>
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Your name" />
            </label>
            <label className="field">
              <span>Room code</span>
              <input
                value={roomCodeInput}
                onChange={(event) => setRoomCodeInput(event.target.value)}
                placeholder="ABC123"
                maxLength={8}
              />
            </label>
          </div>

          <div className="button-row">
            <button className="button button-primary" onClick={onCreateRoom} disabled={busy}>
              Create room
            </button>
            <button className="button button-secondary" onClick={onJoinRoom} disabled={busy}>
              Join room
            </button>
          </div>

          <button className="button button-tertiary" onClick={onStartDemo} disabled={busy}>
            Start demo room
          </button>

          <p className="status-copy">{statusMessage || 'Create a room or join a shared lobby to begin.'}</p>
        </div>
      </section>
    </main>
  )
}

function LobbyScreen({ room, players, myPeerId, scores, onAddGuest, onStartRound, onBackToHome, statusMessage }) {
  const host = players.find((player) => player.id === room?.hostPeerId) ?? players[0]

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Lobby</p>
          <h1>Room {room?.code ?? 'UNKNOWN'}</h1>
          <p className="lede">Invite a few players, then start the round when the table is ready.</p>
        </div>

        <div className="room-chip">Host: {host?.nickname ?? 'Unknown'}</div>
      </section>

      <section className="content-grid">
        <article className="card">
          <h2>Players</h2>
          <div className="player-list">
            {players.map((player) => (
              <div key={player.id} className={`player-row ${player.id === myPeerId ? 'is-you' : ''}`}>
                <div>
                  <strong>{player.nickname}</strong>
                  <span>{player.role}</span>
                </div>
                <span>
                  {scores[player.id] ?? 0} {scoreLabel(scores[player.id] ?? 0)}
                </span>
              </div>
            ))}
          </div>

          <div className="button-row">
            <button className="button button-secondary" onClick={onAddGuest}>
              Add guest
            </button>
            <button className="button button-primary" onClick={onStartRound}>
              Start round
            </button>
          </div>
        </article>

        <article className="card card-muted">
          <h2>How it works</h2>
          <ol className="guide-list">
            <li>One player is secretly clueless about the word.</li>
            <li>Everyone shares a clue without overexplaining.</li>
            <li>Vote for who seems least informed and score the round.</li>
          </ol>

          <p className="status-copy">{statusMessage}</p>

          <button className="button button-tertiary" onClick={onBackToHome}>
            Leave room
          </button>
        </article>
      </section>
    </main>
  )
}

function RoleRevealScreen({ player, round, cluelessPlayer, onContinue }) {
  const isClueless = player?.id === round?.cluelessId

  return (
    <main className="app-shell centered-shell">
      <article className="card reveal-card">
        <p className="eyebrow">Role reveal</p>
        <h1>{isClueless ? 'You are clueless' : 'You are informed'}</h1>
        <p className="lede">
          {isClueless
            ? 'You will not see the word. Read the room, bluff naturally, and keep the conversation moving.'
            : `The secret word is ${round?.secretWord}. Keep it tight and do not tip off ${cluelessPlayer?.nickname ?? 'the clueless player'}.`}
        </p>

        <div className="highlight-strip">
          <span>{player?.nickname ?? 'Player'}</span>
          <span>{isClueless ? 'Clueless' : 'Informed'}</span>
        </div>

        <button className="button button-primary" onClick={onContinue}>
          Continue
        </button>
      </article>
    </main>
  )
}

function ClueScreen({ round, player, clueText, setClueText, onSubmitClue }) {
  const isClueless = player?.id === round?.cluelessId

  return (
    <main className="app-shell centered-shell">
      <article className="card clue-card">
        <p className="eyebrow">Clue round</p>
        <h1>{isClueless ? 'Bluff your way through' : 'Share a clue'}</h1>
        <p className="lede">
          {isClueless
            ? 'You do not know the secret word. Give a believable clue that keeps you in the game.'
            : 'Give a clue that points toward the secret word without spelling it out.'}
        </p>

        <label className="field field-large">
          <span>Your clue</span>
          <textarea
            rows={5}
            value={clueText}
            onChange={(event) => setClueText(event.target.value)}
            placeholder={isClueless ? 'Something vague, but confident.' : 'A sharp, suggestive hint.'}
          />
        </label>

        <button className="button button-primary" onClick={onSubmitClue}>
          Submit clue
        </button>
      </article>
    </main>
  )
}

function VoteScreen({ players, myPeerId, round, selectedVote, setSelectedVote, onSubmitVote }) {
  if (!round) {
    return null
  }

  const candidates = players.filter((player) => player.id !== myPeerId)

  return (
    <main className="app-shell centered-shell">
      <article className="card vote-card">
        <p className="eyebrow">Vote</p>
        <h1>Who seems clueless?</h1>
        <p className="lede">Pick the player who feels least connected to the word.</p>

        <div className="candidate-list">
          {candidates.map((player) => (
            <button
              key={player.id}
              className={`candidate-card ${selectedVote === player.id ? 'is-selected' : ''}`}
              onClick={() => setSelectedVote(player.id)}
            >
              <strong>{player.nickname}</strong>
              <span>{player.role}</span>
            </button>
          ))}
        </div>

        <button className="button button-primary" onClick={onSubmitVote} disabled={!selectedVote}>
          Cast vote
        </button>
      </article>
    </main>
  )
}

function ResultScreen({ players, scores, round, cluelessPlayer, onBackToLobby }) {
  if (!round) {
    return null
  }

  return (
    <main className="app-shell centered-shell result-shell">
      <div className="confetti-band" aria-hidden="true" />
      <article className="card result-card">
        <p className="eyebrow">Round result</p>
        <h1>The clueless one was {cluelessPlayer?.nickname ?? 'unknown'}</h1>
        <p className="lede">
          Secret word: <strong>{round.secretWord}</strong>
        </p>

        <div className="scoreboard">
          {players.map((player) => (
            <div key={player.id} className="player-row">
              <div>
                <strong>{player.nickname}</strong>
                <span>{player.role}</span>
              </div>
              <span>
                {scores[player.id] ?? 0} {scoreLabel(scores[player.id] ?? 0)}
              </span>
            </div>
          ))}
        </div>

        <button className="button button-primary" onClick={onBackToLobby}>
          Back to lobby
        </button>
      </article>
    </main>
  )
}

export default App
