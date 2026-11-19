"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Profile } from "@/lib/types";
import {
  Puzzle,
  SquareName,
  getDailyPuzzle,
  playChessSound,
  FriendLeaderboardEntry,
} from "@/lib/puzzles";

// Unicode piece icons for crisp rendering
const PIECE_SYMBOLS: Record<string, string> = {
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",
  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

// 18 stepping stones on the journey trail with coordinates
const JOURNEY_MILESTONES = [
  { level: 1, x: 74, y: 88, completed: true },
  { level: 2, x: 60, y: 84, completed: true },
  { level: 3, x: 46, y: 79, completed: true },
  { level: 4, x: 34, y: 74, completed: true },
  { level: 5, x: 25, y: 69, completed: true },
  { level: 6, x: 38, y: 64, isCurrent: true },
  { level: 7, x: 50, y: 59 },
  { level: 8, x: 63, y: 55 },
  { level: 9, x: 73, y: 50 },
  { level: 10, x: 64, y: 45 },
  { level: 11, x: 52, y: 40 },
  { level: 12, x: 40, y: 35 },
  { level: 13, x: 28, y: 30 },
  { level: 14, x: 38, y: 25 },
  { level: 15, x: 50, y: 20 },
  { level: 16, x: 62, y: 15 },
  { level: 17, x: 74, y: 10 },
  { level: 18, x: 60, y: 5 },
];

export default function PuzzlesClient({
  profile,
  friendsList,
  currentUserId,
}: {
  profile: Profile;
  friendsList: Array<{
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    style_prefs: unknown;
  }>;
  currentUserId: string;
}) {
  const initialStats = profile.style_prefs?.puzzleStats || {
    streak: 0,
    bestStreak: 0,
    rating: 1200,
    totalSolved: 0,
    solvedToday: false,
  };
  const [stats, setStats] = useState(initialStats);
  const [userLevel, setUserLevel] = useState(Math.min(18, Math.max(1, (initialStats.totalSolved || 0) + 1)));
  const [showArenaModal, setShowArenaModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Puzzle Board State
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(getDailyPuzzle(Math.min(18, Math.max(1, (initialStats.totalSolved || 0) + 1))));
  const [boardState, setBoardState] = useState<Partial<Record<SquareName, string>>>({
    ...currentPuzzle.initialBoard,
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<SquareName | null>(null);
  const [feedback, setFeedback] = useState<{ type: "idle" | "correct" | "wrong" | "solved"; message: string }>({
    type: "idle",
    message: currentPuzzle.description,
  });
  const [showHint, setShowHint] = useState(false);
  const [cheeredFriends, setCheeredFriends] = useState<Set<string>>(new Set());

  // Real friends positioned on the puzzle road map - loaded purely from real database following list
  const realFriends: FriendLeaderboardEntry[] = (friendsList || []).map((f) => {
    const prefs = f.style_prefs as Record<string, unknown> | undefined;
    const pStats = prefs?.puzzleStats as Record<string, number> | undefined;
    return {
      id: f.id,
      username: f.username,
      fullName: f.full_name || f.username,
      avatarUrl: f.avatar_url,
      streak: pStats?.streak ?? 0,
      level: Math.min(18, Math.max(1, (pStats?.totalSolved ?? 0) + 1)),
      rating: pStats?.rating ?? 1200,
      solvedToday: !!pStats?.solvedToday,
      themeBadge: "Friend",
      isCurrentUser: false,
    };
  });

  const friendsOnMap: FriendLeaderboardEntry[] = [
    {
      id: currentUserId,
      username: profile.username || "you",
      fullName: profile.full_name || "You",
      avatarUrl: profile.avatar_url,
      streak: stats.streak,
      level: userLevel,
      rating: stats.rating,
      solvedToday: !!stats.solvedToday,
      themeBadge: "✨ You",
      isCurrentUser: true,
    },
    ...realFriends,
  ];

  const handleStartPuzzle = (lvl: number) => {
    const puzzle = getDailyPuzzle(lvl);
    setCurrentPuzzle(puzzle);
    setBoardState({ ...puzzle.initialBoard });
    setCurrentStepIndex(0);
    setSelectedSquare(null);
    setShowHint(false);
    setFeedback({
      type: "idle",
      message: puzzle.description,
    });
    setShowArenaModal(true);
  };

  const handleSquareClick = (square: SquareName) => {
    if (feedback.type === "solved") return;

    if (!selectedSquare) {
      const piece = boardState[square];
      if (piece && piece.startsWith(currentPuzzle.playerColor)) {
        setSelectedSquare(square);
        playChessSound("move");
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    const expectedStep = currentPuzzle.solutionSteps[currentStepIndex];
    if (expectedStep && expectedStep.from === selectedSquare && expectedStep.to === square) {
      // CORRECT MOVE
      const movingPiece = boardState[selectedSquare];
      const nextBoard = { ...boardState };
      delete nextBoard[selectedSquare];
      nextBoard[square] = movingPiece;
      setBoardState(nextBoard);
      setSelectedSquare(null);

      const nextStepIdx = currentStepIndex + 1;

      if (nextStepIdx >= currentPuzzle.solutionSteps.length) {
        // SOLVED
        playChessSound("solve");
        setFeedback({
          type: "solved",
          message: `🎉 Checkmate! Level ${currentPuzzle.level} Solved!`,
        });

        const nextLevel = Math.max(userLevel, currentPuzzle.level + 1);
        setUserLevel(nextLevel);

        const updatedStats = {
          ...stats,
          streak: stats.streak + 1,
          bestStreak: Math.max(stats.bestStreak, stats.streak + 1),
          rating: stats.rating + 15,
          totalSolved: stats.totalSolved + 1,
          solvedToday: true,
        };
        setStats(updatedStats);

        fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            style_prefs: {
              ...profile.style_prefs,
              puzzleStats: updatedStats,
            },
          }),
        }).catch(() => {});

        toast.success(`Level ${currentPuzzle.level} Cleared! 🔥 Streak Extended!`, { icon: "🏆" });
      } else {
        // Intermediate move
        playChessSound("check");
        setFeedback({
          type: "correct",
          message: "Great move! Opponent responding…",
        });
        setCurrentStepIndex(nextStepIdx);

        const opponentStep = currentPuzzle.solutionSteps[nextStepIdx];
        if (opponentStep) {
          setTimeout(() => {
            setBoardState((prev) => {
              const b = { ...prev };
              const oppPiece = b[opponentStep.from];
              delete b[opponentStep.from];
              b[opponentStep.to] = oppPiece;
              return b;
            });
            playChessSound("move");
            setCurrentStepIndex(nextStepIdx + 1);
          }, 450);
        }
      }
    } else {
      // WRONG MOVE
      playChessSound("wrong");
      setSelectedSquare(null);
      setFeedback({
        type: "wrong",
        message: "Not the best move. Try again! 🤔",
      });
    }
  };

  const handleCheer = (friendId: string, name: string) => {
    playChessSound("cheer");
    setCheeredFriends((prev) => new Set([...prev, friendId]));
    toast.success(`You cheered for ${name}! 👏🔥`, { icon: "🎉" });
  };

  return (
    <div style={styles.page}>
      {/* Top Banner with Chess Coach Speech Bubble (Chess.com Style) */}
      <div style={styles.topJourneyBar}>
        <div style={styles.topBarContent}>
          <div style={styles.puzzlesCountPill}>
            <span style={styles.puzzlePieceIcon}>🧩</span>
            <span style={styles.puzzleCountText}>{userLevel} Puzzles</span>
          </div>

          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            style={styles.leaderboardToggleBtn}
          >
            👥 Friends on Map ({realFriends.length})
          </button>
        </div>

        {/* Coach Speech Bubble */}
        <div style={styles.coachBubbleRow}>
          <div style={styles.coachAvatar}>👨🏻‍🏫</div>
          <div style={styles.coachSpeechBubble}>
            Think you are faster than your friends? Solve today’s puzzle on the road to extend your streak!
            <div style={styles.bubbleTail} />
          </div>
        </div>
      </div>

      {/* Main Chess.com Puzzle Journey Landscape Map */}
      <div style={styles.mapContainer}>
        {/* Isometric Checkered Green Grass Background */}
        <div style={styles.lawnPattern} />

        {/* Scenery Environment Props */}
        {/* 1. Cozy Wooden Log Cabin with Chimney */}
        <div style={styles.cabinWrap}>
          <div style={styles.cabinEmoji}>🏡</div>
          <span style={styles.cabinLabel}>Puzzle Cottage</span>
        </div>

        {/* 2. Water Pond with Lilies and Frog */}
        <div style={styles.pondWrap}>
          <div style={styles.pondBody}>
            <span style={styles.lilyEmoji}>🪷</span>
            <span style={styles.frogEmoji}>🐸</span>
          </div>
        </div>

        {/* 3. Park Bench with Chessboard under Trees */}
        <div style={styles.benchWrap}>
          <span style={styles.treeEmoji}>🌳</span>
          <div style={styles.bench}>
            <span>🪑</span>
            <span style={styles.miniBoard}>♟️</span>
          </div>
        </div>

        {/* The Stepping Stones Path */}
        {JOURNEY_MILESTONES.map((stone) => {
          const isDone = stone.level < userLevel;
          const isCurrent = stone.level === userLevel;

          // Find if any friends are stationed on this stone!
          const friendsOnThisTile = friendsOnMap.filter((f) => f.level === stone.level);

          return (
            <div
              key={stone.level}
              style={{
                ...styles.milestoneWrap,
                left: `${stone.x}%`,
                top: `${stone.y}%`,
              }}
            >
              {/* Stepping Stone Button */}
              <button
                type="button"
                onClick={() => handleStartPuzzle(stone.level)}
                style={{
                  ...styles.stoneButton,
                  background: isDone
                    ? "linear-gradient(135deg, #7CAD2A, #578018)"
                    : isCurrent
                    ? "linear-gradient(135deg, #F9D678, #E2B038)"
                    : "linear-gradient(135deg, #61462D, #4A331E)",
                  border: isCurrent
                    ? "3px solid #FFFFFF"
                    : isDone
                    ? "2px solid #A8D63A"
                    : "2px solid #755539",
                  boxShadow: isCurrent
                    ? "0 0 0 4px #5F8520, 0 8px 16px rgba(0,0,0,0.3)"
                    : "0 6px 12px rgba(0,0,0,0.25)",
                }}
                title={`Level ${stone.level} - ${isDone ? "Completed" : isCurrent ? "Play Next!" : "Upcoming"}`}
              >
                {isDone ? (
                  <span style={styles.checkMark}>✓</span>
                ) : (
                  <span
                    style={{
                      ...styles.stoneNumber,
                      color: isCurrent ? "#3A2800" : "#DDC8B4",
                    }}
                  >
                    {stone.level}
                  </span>
                )}
              </button>

              {/* Current Player Avatar / Pawn Indicator on active tile */}
              {isCurrent && (
                <div style={styles.playerPawnMarker}>
                  <div style={styles.playerAvatarBubble}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" style={styles.playerAvatarImg} />
                    ) : (
                      <span style={styles.playerPawnIcon}>♟️</span>
                    )}
                  </div>
                  <div style={styles.playerPawnTail} />
                </div>
              )}

              {/* Friends Avatars stationed at their current level on the road! */}
              {friendsOnThisTile.length > 0 && (
                <div style={styles.friendsOnTileWrap}>
                  {friendsOnThisTile.map((friend) => (
                    <div
                      key={friend.id}
                      style={styles.friendBadgeOnMap}
                      title={`${friend.fullName} (@${friend.username}) • Level ${friend.level} • 🔥 ${friend.streak} Streak`}
                    >
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt="" style={styles.friendMapAvatar} />
                      ) : (
                        <div style={styles.friendMapAvatarFb}>
                          {friend.username[0].toUpperCase()}
                        </div>
                      )}
                      <span style={styles.friendMapStreak}>🔥{friend.streak}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Action Bar (Chess.com Style) */}
      <div style={styles.bottomBar}>
        <div style={styles.bottomBarStats}>
          <div style={styles.ratingBox}>
            <span style={styles.ratingVal}>{stats.rating}</span>
            <span style={styles.streakFlame}>🔥 {stats.streak}</span>
          </div>
          <div style={styles.progressBarWrap}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${Math.min(100, (userLevel / 18) * 100)}%`,
              }}
            />
          </div>
          <span style={styles.progressText}>Level {userLevel} of 18</span>
        </div>

        <button
          onClick={() => handleStartPuzzle(userLevel)}
          style={styles.mainSolveBtn}
        >
          <span>Solve Puzzle #{userLevel}</span>
          <span style={styles.playArrow}>▶</span>
        </button>
      </div>

      {/* Friends on Road Leaderboard Modal / Drawer */}
      {showLeaderboard && (
        <div style={styles.modalOverlay} onClick={() => setShowLeaderboard(false)}>
          <div style={styles.leaderboardDrawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHead}>
              <div>
                <h3 style={styles.drawerTitle}>👥 Friends on the Puzzle Road</h3>
                <p style={styles.drawerSub}>Track who is ahead and cheer their streaks!</p>
              </div>
              <button onClick={() => setShowLeaderboard(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.drawerList}>
              {realFriends.length === 0 ? (
                <div style={styles.emptyDrawer}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                  <h4 style={{ fontSize: 15, fontWeight: "700", color: "#2C3318", margin: "0 0 6px" }}>
                    No friends on the road yet
                  </h4>
                  <p style={{ fontSize: 13, color: "#6F7658", lineHeight: 1.4, margin: "0 0 16px" }}>
                    Follow real people in Explore to see their avatars, puzzle streaks, and milestones on your road!
                  </p>
                  <Link
                    href="/explore"
                    style={styles.findFriendsBtn}
                    onClick={() => setShowLeaderboard(false)}
                  >
                    Find Friends in Explore ✨
                  </Link>
                </div>
              ) : (
                friendsOnMap
                  .sort((a, b) => b.level - a.level || b.streak - a.streak)
                  .map((friend, idx) => {
                    const hasCheered = cheeredFriends.has(friend.id);
                    return (
                      <div
                        key={friend.id}
                        style={{
                          ...styles.drawerItem,
                          background: friend.isCurrentUser ? "rgba(168, 214, 58, 0.16)" : "#FAF9F4",
                          border: friend.isCurrentUser ? "1.5px solid #769A28" : "1px solid #EFECE3",
                        }}
                      >
                        <span style={styles.rankNum}>#{idx + 1}</span>

                        <div style={styles.drawerAvatarWrap}>
                          {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt="" style={styles.drawerAvatar} />
                          ) : (
                            <div style={styles.drawerAvatarFb}>
                              {(friend.fullName || friend.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div style={styles.drawerDetails}>
                          <div style={styles.drawerNameRow}>
                            <span style={styles.drawerName}>{friend.fullName}</span>
                            {friend.isCurrentUser && <span style={styles.youPill}>You</span>}
                          </div>
                          <span style={styles.drawerMeta}>
                            Stump Level {friend.level} • {friend.rating} Elo
                          </span>
                        </div>

                        <div style={styles.drawerActionsCol}>
                          <span style={styles.streakBadgeText}>🔥 {friend.streak}d</span>
                          {!friend.isCurrentUser && (
                            <button
                              onClick={() => handleCheer(friend.id, friend.fullName)}
                              disabled={hasCheered}
                              style={{
                                ...styles.cheerButton,
                                background: hasCheered ? "#EBF5D5" : "#FFFFFF",
                                border: hasCheered ? "1px solid #769A28" : "1px solid #D6DBC2",
                              }}
                            >
                              {hasCheered ? "👏 Cheered" : "👏 Cheer"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Chess Puzzle Arena Modal */}
      {showArenaModal && (
        <div style={styles.modalOverlay} onClick={() => setShowArenaModal(false)}>
          <div style={styles.puzzleArenaModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.arenaHeader}>
              <div>
                <span style={styles.levelTag}>LEVEL #{currentPuzzle.level} • {currentPuzzle.theme}</span>
                <h3 style={styles.arenaTitle}>{currentPuzzle.title}</h3>
              </div>
              <button onClick={() => setShowArenaModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            {/* Tactical instruction banner */}
            <div
              style={{
                ...styles.feedbackPill,
                background:
                  feedback.type === "solved"
                    ? "#DCF5B8"
                    : feedback.type === "correct"
                    ? "#EBF5D5"
                    : feedback.type === "wrong"
                    ? "#FDE8E8"
                    : "#F5F3EC",
                border:
                  feedback.type === "solved"
                    ? "1px solid #769A28"
                    : feedback.type === "wrong"
                    ? "1px solid #E57373"
                    : "1px solid #E6E1D4",
                color: feedback.type === "wrong" ? "#B71C1C" : "#2C3318",
              }}
            >
              {feedback.message}
            </div>

            {/* Playable Chess Board */}
            <div style={styles.boardWrap}>
              <div style={styles.chessboard}>
                {RANKS.map((rank) => (
                  <div key={rank} style={styles.boardRow}>
                    {FILES.map((file) => {
                      const square = `${file}${rank}` as SquareName;
                      const piece = boardState[square];
                      const isLight = (file.charCodeAt(0) + rank) % 2 === 1;
                      const isSelected = selectedSquare === square;

                      return (
                        <button
                          key={square}
                          type="button"
                          onClick={() => handleSquareClick(square)}
                          style={{
                            ...styles.square,
                            background: isSelected
                              ? "rgba(168, 214, 58, 0.7)"
                              : isLight
                              ? "#F5F2EB"
                              : "#B5C698",
                          }}
                        >
                          {piece && (
                            <span
                              style={{
                                ...styles.chessPiece,
                                color: piece.startsWith("w") ? "#FFFFFF" : "#1A2010",
                                textShadow: piece.startsWith("w")
                                  ? "0 1px 3px rgba(0,0,0,0.45)"
                                  : "none",
                              }}
                            >
                              {PIECE_SYMBOLS[piece] || ""}
                            </span>
                          )}
                          {file === "a" && <span style={styles.rankLbl}>{rank}</span>}
                          {rank === 1 && <span style={styles.fileLbl}>{file}</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div style={styles.arenaActions}>
              <button
                onClick={() => {
                  setBoardState({ ...currentPuzzle.initialBoard });
                  setCurrentStepIndex(0);
                  setSelectedSquare(null);
                  setFeedback({ type: "idle", message: currentPuzzle.description });
                }}
                style={styles.arenaBtn}
              >
                🔄 Reset
              </button>
              <button
                onClick={() => {
                  setShowHint(!showHint);
                  if (!showHint) toast(currentPuzzle.hint, { icon: "💡" });
                }}
                style={styles.arenaBtn}
              >
                💡 {showHint ? "Hide Hint" : "Hint"}
              </button>
              {feedback.type === "solved" ? (
                <button
                  onClick={() => {
                    const next = userLevel;
                    handleStartPuzzle(next);
                  }}
                  style={styles.arenaNextBtn}
                >
                  Next Level →
                </button>
              ) : (
                <button onClick={() => setShowArenaModal(false)} style={styles.arenaNextBtn}>
                  Back to Map 🗺️
                </button>
              )}
            </div>

            {showHint && (
              <div style={styles.hintCard}>
                <b>Tactical Clue:</b> {currentPuzzle.hint}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "0 0 100px",
    minHeight: "100vh",
    position: "relative",
  },
  topJourneyBar: {
    padding: "16px 20px 12px",
    background: "rgba(246, 243, 235, 0.95)",
    backdropFilter: "blur(14px)",
    borderBottom: "1px solid #E6E1D4",
    position: "sticky",
    top: 0,
    zIndex: 30,
  },
  topBarContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  puzzlesCountPill: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#FFFFFF",
    border: "1.5px solid #D6DBC2",
    padding: "6px 14px",
    borderRadius: "999px",
    boxShadow: "0 2px 8px rgba(44, 51, 24, 0.05)",
  },
  puzzlePieceIcon: {
    fontSize: "18px",
  },
  puzzleCountText: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#2C3318",
  },
  leaderboardToggleBtn: {
    padding: "7px 14px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    border: "none",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(107, 154, 35, 0.25)",
  },
  coachBubbleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  coachAvatar: {
    fontSize: "32px",
    lineHeight: 1,
  },
  coachSpeechBubble: {
    position: "relative",
    background: "#FFFFFF",
    border: "1px solid #DCE6C8",
    padding: "8px 14px",
    borderRadius: "14px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#3F4B23",
    lineHeight: 1.4,
    flex: 1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  bubbleTail: {
    position: "absolute",
    left: "-6px",
    top: "10px",
    width: "10px",
    height: "10px",
    background: "#FFFFFF",
    borderLeft: "1px solid #DCE6C8",
    borderBottom: "1px solid #DCE6C8",
    transform: "rotate(45deg)",
  },
  mapContainer: {
    position: "relative",
    width: "100%",
    height: "1150px",
    background: "#2E5C26",
    overflow: "hidden",
    boxShadow: "inset 0 0 40px rgba(0,0,0,0.3)",
  },
  lawnPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(45deg, #32642A 25%, transparent 25%),
      linear-gradient(-45deg, #32642A 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #32642A 75%),
      linear-gradient(-45deg, transparent 75%, #32642A 75%)
    `,
    backgroundSize: "60px 60px",
    backgroundPosition: "0 0, 0 30px, 30px -30px, -30px 0px",
    opacity: 0.85,
  },
  cabinWrap: {
    position: "absolute",
    bottom: "160px",
    right: "30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 5,
  },
  cabinEmoji: {
    fontSize: "72px",
    filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.4))",
  },
  cabinLabel: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#E2F0C4",
    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
  },
  pondWrap: {
    position: "absolute",
    top: "220px",
    right: "40px",
    zIndex: 4,
  },
  pondBody: {
    width: "120px",
    height: "80px",
    borderRadius: "50% 60% 40% 70% / 60% 50% 70% 40%",
    background: "radial-gradient(ellipse at 40% 40%, #5BB5EA, #256EAB)",
    border: "3px solid #73C9FA",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    boxShadow: "inset 0 4px 12px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.25)",
  },
  lilyEmoji: {
    fontSize: "22px",
  },
  frogEmoji: {
    fontSize: "22px",
  },
  benchWrap: {
    position: "absolute",
    top: "460px",
    left: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 5,
  },
  treeEmoji: {
    fontSize: "64px",
    filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))",
  },
  bench: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    fontSize: "24px",
    marginTop: "-16px",
  },
  miniBoard: {
    fontSize: "18px",
  },
  milestoneWrap: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 10,
  },
  stoneButton: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    transition: "transform 0.15s ease",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: "24px",
    fontWeight: "900",
  },
  stoneNumber: {
    fontSize: "18px",
    fontWeight: "900",
  },
  playerPawnMarker: {
    position: "absolute",
    top: "-42px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 20,
    animation: "bounce 1.5s infinite",
  },
  playerAvatarBubble: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "2.5px solid #FFFFFF",
    background: "#FFFFFF",
    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
  },
  playerAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  playerPawnIcon: {
    fontSize: "24px",
  },
  playerPawnTail: {
    width: "8px",
    height: "8px",
    background: "#FFFFFF",
    transform: "rotate(45deg)",
    marginTop: "-4px",
  },
  friendsOnTileWrap: {
    position: "absolute",
    bottom: "-24px",
    display: "flex",
    gap: "4px",
    zIndex: 15,
  },
  friendBadgeOnMap: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
    background: "rgba(0,0,0,0.75)",
    padding: "2px 5px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.4)",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  },
  friendMapAvatar: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  friendMapAvatarFb: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#A8D63A",
    color: "#1E260F",
    fontSize: "10px",
    fontWeight: "bold",
    display: "grid",
    placeItems: "center",
  },
  friendMapStreak: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#FDE68A",
  },
  bottomBar: {
    position: "fixed",
    bottom: 0,
    left: "260px",
    right: 0,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(18px)",
    borderTop: "1px solid #E6E1D4",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 40,
    boxShadow: "0 -6px 20px rgba(0,0,0,0.06)",
  },
  bottomBarStats: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
  },
  ratingBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#F4F1EA",
    padding: "6px 12px",
    borderRadius: "12px",
    border: "1px solid #E2DEC8",
  },
  ratingVal: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#2C3318",
  },
  streakFlame: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#B45309",
  },
  progressBarWrap: {
    flex: 1,
    maxWidth: "240px",
    height: "10px",
    borderRadius: "999px",
    background: "#E8E5DA",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #A8D63A, #5F8520)",
    borderRadius: "999px",
    transition: "width 0.4s ease",
  },
  progressText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#6F7658",
  },
  mainSolveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 28px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #7CAD2A, #547A17)",
    border: "none",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(87, 128, 24, 0.35)",
  },
  playArrow: {
    fontSize: "12px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(35, 42, 20, 0.6)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "16px",
  },
  puzzleArenaModal: {
    background: "#FFFFFF",
    borderRadius: "28px",
    width: "100%",
    maxWidth: "460px",
    padding: "24px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
  },
  arenaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  levelTag: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#5F8520",
    letterSpacing: "0.04em",
  },
  arenaTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#2C3318",
    margin: "2px 0 0",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    color: "#8E9675",
    cursor: "pointer",
  },
  feedbackPill: {
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "14px",
    textAlign: "center",
  },
  boardWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  chessboard: {
    width: "100%",
    maxWidth: "340px",
    aspectRatio: "1",
    border: "3px solid #578018",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
    display: "flex",
    flexDirection: "column",
  },
  boardRow: {
    display: "flex",
    flex: 1,
  },
  square: {
    flex: 1,
    position: "relative",
    display: "grid",
    placeItems: "center",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  chessPiece: {
    fontSize: "28px",
    userSelect: "none",
  },
  rankLbl: {
    position: "absolute",
    top: 2,
    left: 3,
    fontSize: "8px",
    fontWeight: "700",
    color: "rgba(0,0,0,0.35)",
  },
  fileLbl: {
    position: "absolute",
    bottom: 2,
    right: 3,
    fontSize: "8px",
    fontWeight: "700",
    color: "rgba(0,0,0,0.35)",
  },
  arenaActions: {
    display: "flex",
    gap: "10px",
  },
  arenaBtn: {
    flex: 1,
    padding: "10px",
    borderRadius: "12px",
    background: "#F6F3EB",
    border: "1px solid #E2DEC8",
    color: "#46522E",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
  },
  arenaNextBtn: {
    flex: 1.4,
    padding: "10px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #7CAD2A, #547A17)",
    border: "none",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(87, 128, 24, 0.25)",
  },
  hintCard: {
    marginTop: "12px",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "#FFFBF0",
    border: "1px solid #F5E2B3",
    fontSize: "12px",
    color: "#805B10",
  },
  leaderboardDrawer: {
    background: "#FFFFFF",
    borderRadius: "28px",
    width: "100%",
    maxWidth: "460px",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
  },
  drawerHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #EFECE3",
  },
  drawerTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#2C3318",
    margin: 0,
  },
  drawerSub: {
    fontSize: "12px",
    color: "#6F7658",
    margin: "3px 0 0",
  },
  drawerList: {
    padding: "16px 20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  drawerItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    borderRadius: "16px",
  },
  rankNum: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#838B6B",
    width: "24px",
  },
  drawerAvatarWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    overflow: "hidden",
  },
  drawerAvatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  drawerAvatarFb: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "bold",
  },
  drawerDetails: {
    flex: 1,
    minWidth: 0,
  },
  drawerNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  drawerName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#2C3318",
  },
  youPill: {
    fontSize: "9px",
    fontWeight: "800",
    background: "#5F8520",
    color: "#FFFFFF",
    padding: "1px 6px",
    borderRadius: "6px",
  },
  drawerMeta: {
    fontSize: "11px",
    color: "#788162",
  },
  drawerActionsCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
  },
  streakBadgeText: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#A16207",
  },
  cheerButton: {
    padding: "3px 9px",
    borderRadius: "8px",
    fontSize: "10px",
    fontWeight: "700",
    color: "#5F8520",
    cursor: "pointer",
  },
  emptyDrawer: {
    textAlign: "center",
    padding: "36px 16px",
    background: "#F9F8F4",
    borderRadius: "20px",
    border: "1px dashed #D6DEC2",
  },
  findFriendsBtn: {
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: "700",
    textDecoration: "none",
    boxShadow: "0 4px 12px rgba(107, 154, 35, 0.25)",
  },
};
