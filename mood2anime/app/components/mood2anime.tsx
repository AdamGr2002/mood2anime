/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ReactPlayer from "react-player/lazy"
import { Sparkles, Star, ChevronLeft, ChevronRight } from "lucide-react"

const moodEmojis = [
  { emoji: "😊", mood: "Happy", genreId: 4 },
  { emoji: "😢", mood: "Sad", genreId: 8 },
  { emoji: "😆", mood: "Excited", genreId: 1 },
  { emoji: "😌", mood: "Relaxed", genreId: 36 },
  { emoji: "😍", mood: "Romantic", genreId: 22 },
  { emoji: "😨", mood: "Scared", genreId: 14 },
  { emoji: "🤔", mood: "Thoughtful", genreId: 7 },
  { emoji: "😔", mood: "Gloomy", genreId: 8 },
  { emoji: "😤", mood: "Angry", genreId: 1 },
  { emoji: "🤩", mood: "Amazed", genreId: 10 },
  { emoji: "😎", mood: "Cool", genreId: 24 },
  { emoji: "🥺", mood: "Emotional", genreId: 8 },
]

interface Anime {
  mal_id: number
  title: string
  synopsis: string
  genres: { name: string }[]
  score: number
  episodes: number
  aired: { string: string }
  trailer: {
    youtube_id: string
    url: string
  }
  members: number // Add this line
}

// Cache interface
interface Cache {
  [key: number]: {
    data: Anime[]
    timestamp: number
  }
}

const CACHE_EXPIRATION = 60 * 60 * 1000 // 1 hour
export default function Mood2Anime() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [recommendedAnime, setRecommendedAnime] = useState<Anime[]>([])
  const [currentAnimeIndex, setCurrentAnimeIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cache, setCache] = useState<Cache>({})

  // Cache expiration time (1 hour)
 

  // Move the cache cleanup logic to a useCallback hook
  const cleanupCache = useCallback(() => {
    const now = Date.now()
    setCache(prevCache => {
      const newCache = { ...prevCache }
      Object.keys(newCache).forEach((key) => {
        if (now - newCache[Number(key)].timestamp > CACHE_EXPIRATION) {
          delete newCache[Number(key)]
        }
      })
      return newCache
    })
  }, [CACHE_EXPIRATION])

  useEffect(() => {
    // Run the cache cleanup when the component mounts
    cleanupCache()

    // Set up an interval to run the cleanup periodically
    const intervalId = setInterval(cleanupCache, CACHE_EXPIRATION)

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId)
  }, [cleanupCache, CACHE_EXPIRATION])

  const fetchAnimeByMood = async (genreId: number) => {
    setLoading(true)
    setError(null)

    // Check if data is in cache and not expired
    if (cache[genreId] && Date.now() - cache[genreId].timestamp < CACHE_EXPIRATION) {
      setRecommendedAnime(cache[genreId].data)
      setCurrentAnimeIndex(0)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/anime?genreId=${genreId}`)
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.')
        }
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      console.log('Received data from API:', data)

      if (data.data && data.data.length > 0) {
        // Filter anime with a minimum score of 6 and sort by popularity
        const animeList = data.data
          .filter((anime: Anime) => anime.score >= 6)
          .sort((a: Anime, b: Anime) => b.members - a.members) // Sort by number of members (popularity)
          .slice(0, 20) // Limit to top 20 most popular

        console.log('Filtered anime list:', animeList)

        if (animeList.length > 0) {
          setRecommendedAnime(animeList)
          setCurrentAnimeIndex(0)
          // Update cache
          setCache((prevCache) => ({
            ...prevCache,
            [genreId]: {
              data: animeList,
              timestamp: Date.now(),
            },
          }))
        } else {
          setError("No popular anime found for this mood. Try a different mood!")
        }
      } else {
        setError("No anime found for this mood. Try a different mood!")
      }
    } catch (err) {
      console.error('Error in fetchAnimeByMood:', err)
      setError(err instanceof Error ? err.message : "An error occurred while fetching anime data. Please try again later.")
    }

    setLoading(false)
  }

  const handleMoodSelect = (mood: string, genreId: number) => {
    setSelectedMood(mood)
    fetchAnimeByMood(genreId)
  }

  const handlePreviousAnime = () => {
    setCurrentAnimeIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : recommendedAnime.length - 1))
  }

  const handleNextAnime = () => {
    setCurrentAnimeIndex((prevIndex) => (prevIndex < recommendedAnime.length - 1 ? prevIndex + 1 : 0))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 to-blue-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-purple-800 mb-2">Mood2Anime</h1>
          <p className="text-xl text-purple-600">Discover your perfect anime based on your mood!</p>
        </div>
        <Card className="backdrop-blur-md bg-white/70 shadow-xl">
          <CardContent className="p-6">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-center text-purple-700">How are you feeling today?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {moodEmojis.map(({ emoji, mood, genreId }) => (
                  <Button
                    key={mood}
                    variant={selectedMood === mood ? "default" : "outline"}
                    className={`text-lg p-4 h-auto flex flex-col items-center justify-center transition-all duration-300 ${
                      selectedMood === mood ? "bg-purple-500 text-white" : "hover:bg-purple-100"
                    }`}
                    onClick={() => handleMoodSelect(mood, genreId)}
                  >
                    <span className="text-4xl mb-2">{emoji}</span>
                    <span>{mood}</span>
                  </Button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 text-sm text-red-500 text-center"
                >
                  {error}
                </motion.p>
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-purple-600 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="animate-spin" />
                  <span>Finding your perfect anime...</span>
                </motion.div>
              )}

              {recommendedAnime.length > 0 && (
                <motion.div
                  key={currentAnimeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8 space-y-6"
                >
                  <h3 className="text-3xl font-bold text-purple-800 mb-4">{recommendedAnime[currentAnimeIndex].title}</h3>
                  
                  {/* YouTube Trailer */}
                  {recommendedAnime[currentAnimeIndex].trailer && recommendedAnime[currentAnimeIndex].trailer.youtube_id ? (
                    <div className="w-full h-[70vh] mb-6">
                      <ReactPlayer
                        url={`https://www.youtube.com/watch?v=${recommendedAnime[currentAnimeIndex].trailer.youtube_id}`}
                        width="100%"
                        height="100%"
                        controls={true}
                      />
                    </div>
                  ) : (
                    <div className="bg-purple-100 p-6 rounded-lg shadow-md text-center mb-6 h-[70vh] flex items-center justify-center">
                      <p className="text-purple-700 text-xl">No trailer available for this anime.</p>
                    </div>
                  )}

                  {/* Anime Details */}
                  <div className="bg-purple-100 p-6 rounded-lg shadow-md">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {recommendedAnime[currentAnimeIndex].genres.map((genre) => (
                        <Badge key={genre.name} variant="secondary" className="bg-purple-200 text-purple-800">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-purple-700 mb-4">{recommendedAnime[currentAnimeIndex].synopsis}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-purple-600">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 mr-2 text-yellow-500" />
                        <span>
                          <span className="font-semibold">Score:</span> {recommendedAnime[currentAnimeIndex].score}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Episodes:</span> {recommendedAnime[currentAnimeIndex].episodes}
                      </div>
                      <div>
                        <span className="font-semibold">Members:</span> {recommendedAnime[currentAnimeIndex].members.toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold">Aired:</span> {recommendedAnime[currentAnimeIndex].aired.string}
                      </div>
                    </div>
                  </div>
                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center mt-4">
                    <Button onClick={handlePreviousAnime} variant="outline" className="flex items-center">
                      <ChevronLeft className="mr-2" /> Previous Anime
                    </Button>
                    <Button onClick={handleNextAnime} variant="outline" className="flex items-center">
                      Next Anime <ChevronRight className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}